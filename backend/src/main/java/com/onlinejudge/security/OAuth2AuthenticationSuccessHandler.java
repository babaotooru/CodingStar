package com.onlinejudge.security;

import com.onlinejudge.entity.User;
import com.onlinejudge.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import java.util.Objects;

@Component
@RequiredArgsConstructor
@SuppressWarnings("null")
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository;

    @Value("${app.frontend-url:https://coding-star.vercel.app}")
    private String appFrontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        try {
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            OAuth2User oAuth2User = oauthToken.getPrincipal();
            String registrationId = oauthToken.getAuthorizedClientRegistrationId();

            User.AuthProvider provider = registrationId.equalsIgnoreCase("google")
                    ? User.AuthProvider.GOOGLE
                    : User.AuthProvider.GITHUB;

            String providerId = extractProviderId(oAuth2User, registrationId);
            String email = extractEmail(oAuth2User, registrationId);
            String name = extractName(oAuth2User, registrationId);

            // Find or create user
            Optional<User> existingUser = userRepository.findByAuthProviderAndProviderId(provider, providerId);
            User user;

            if (existingUser.isPresent()) {
                user = existingUser.get();
                // Update email if previously null and now available
                if (user.getEmail() == null && email != null) {
                    user.setEmail(email);
                    userRepository.save(user);
                }
            } else {
                // Check if email already exists (link to existing account)
                Optional<User> emailUser = (email != null && !email.isBlank())
                        ? userRepository.findByEmail(email)
                        : Optional.empty();
                if (emailUser.isPresent()) {
                    user = emailUser.get();
                    user.setAuthProvider(provider);
                    user.setProviderId(providerId);
                    userRepository.save(user);
                } else {
                    // Create new user
                    String username = generateUniqueUsername(name);
                    user = Objects.requireNonNull(User.builder()
                            .username(username)
                            .email(email)
                            .authProvider(provider)
                            .providerId(providerId)
                            .role(User.Role.USER)
                            .build());
                    userRepository.save(user);
                }
            }

            String token = jwtUtil.generateToken(user.getUsername());

            String redirectUrl = UriComponentsBuilder
                    .fromUriString(resolveFrontendUrl(request, response) + "/oauth-callback")
                    .queryParam("token", token)
                    .queryParam("username", user.getUsername())
                    .queryParam("email", user.getEmail() != null ? user.getEmail() : "")
                    .queryParam("role", user.getRole().name())
                    .build().toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } catch (Exception ex) {
            // If persistence fails (for example, Render cannot reach the DB), still
            // complete login
            // with a temporary token so the user lands back in the app instead of a
            // Whitelabel page.
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            OAuth2User oAuth2User = oauthToken.getPrincipal();
            String registrationId = oauthToken.getAuthorizedClientRegistrationId();
            String providerId = extractProviderId(oAuth2User, registrationId);
            String name = extractName(oAuth2User, registrationId);
            String fallbackUsername = buildFallbackUsername(name, providerId);
            String email = extractEmail(oAuth2User, registrationId);

            String token = jwtUtil.generateToken(fallbackUsername);
            String redirectUrl = UriComponentsBuilder
                    .fromUriString(resolveFrontendUrl(request, response) + "/oauth-callback")
                    .queryParam("token", token)
                    .queryParam("username", fallbackUsername)
                    .queryParam("email", email != null ? email : "")
                    .queryParam("role", User.Role.USER.name())
                    .queryParam("degraded", "true")
                    .build().toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }
    }

    private String extractProviderId(OAuth2User user, String registrationId) {
        if ("google".equals(registrationId)) {
            return user.getAttribute("sub");
        } else {
            Object id = user.getAttribute("id");
            return id != null ? id.toString() : "";
        }
    }

    private String extractEmail(OAuth2User user, String registrationId) {
        // GitHub may not return 'email' directly if the user keeps it private.
        // Try common locations: 'email', 'emails' (list), or nested structures.
        Object emailAttr = user.getAttribute("email");
        if (emailAttr != null)
            return emailAttr.toString();

        Object emailsObj = user.getAttribute("emails");
        if (emailsObj instanceof Iterable) {
            for (Object item : (Iterable<?>) emailsObj) {
                if (item == null)
                    continue;
                if (item instanceof String)
                    return item.toString();
                if (item instanceof java.util.Map) {
                    Object e = ((java.util.Map<?, ?>) item).get("email");
                    Object primary = ((java.util.Map<?, ?>) item).get("primary");
                    if (e != null)
                        return e.toString();
                    if (primary != null && Boolean.parseBoolean(primary.toString())) {
                        Object em = ((java.util.Map<?, ?>) item).get("email");
                        if (em != null)
                            return em.toString();
                    }
                }
            }
        }

        // As a last resort, some providers expose 'login' which we can use as a
        // username
        Object login = user.getAttribute("login");
        return login != null ? null : null; // prefer null when no email available
    }

    private String extractName(OAuth2User user, String registrationId) {
        if ("google".equals(registrationId)) {
            String name = user.getAttribute("name");
            return name != null ? name : "user";
        } else {
            String login = user.getAttribute("login");
            return login != null ? login : "user";
        }
    }

    private String generateUniqueUsername(String baseName) {
        String sanitized = baseName.replaceAll("[^a-zA-Z0-9_]", "").toLowerCase();
        if (sanitized.length() < 3)
            sanitized = "user";
        if (!userRepository.existsByUsername(sanitized)) {
            return sanitized;
        }
        String candidate;
        do {
            candidate = sanitized + "_" + UUID.randomUUID().toString().substring(0, 5);
        } while (userRepository.existsByUsername(candidate));
        return candidate;
    }

    private String buildFallbackUsername(String baseName, String providerId) {
        String sanitized = baseName == null ? "user" : baseName.replaceAll("[^a-zA-Z0-9_]", "").toLowerCase();
        if (sanitized.length() < 3) {
            sanitized = "user";
        }
        String suffix = providerId == null || providerId.isBlank()
                ? UUID.randomUUID().toString().substring(0, 5)
                : providerId.replaceAll("[^a-zA-Z0-9]", "").substring(0, Math.min(5,
                        providerId.replaceAll("[^a-zA-Z0-9]", "").length()));
        return sanitized + "_" + suffix;
    }

    private String resolveFrontendUrl(HttpServletRequest request, HttpServletResponse response) {
        OAuth2AuthorizationRequest authorizationRequest = authorizationRequestRepository.removeAuthorizationRequest(
                request,
                response);
        if (authorizationRequest != null) {
            Object frontendUrl = authorizationRequest.getAttributes().get("frontend_url");
            if (frontendUrl != null) {
                String candidate = frontendUrl.toString().trim();
                if (!candidate.isBlank()) {
                    return candidate;
                }
            }
        }
        return appFrontendUrl;
    }
}
