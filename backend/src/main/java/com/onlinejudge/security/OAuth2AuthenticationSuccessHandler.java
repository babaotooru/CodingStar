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

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
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
                    ? userRepository.findByEmail(email) : Optional.empty();
            if (emailUser.isPresent()) {
                user = emailUser.get();
                user.setAuthProvider(provider);
                user.setProviderId(providerId);
                userRepository.save(user);
            } else {
                // Create new user
                String username = generateUniqueUsername(name);
                user = User.builder()
                        .username(username)
                        .email(email)
                        .authProvider(provider)
                        .providerId(providerId)
                        .role(User.Role.USER)
                        .build();
                userRepository.save(user);
            }
        }

        String token = jwtUtil.generateToken(user.getUsername());

        String redirectUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/oauth-callback")
                .queryParam("token", token)
                .queryParam("username", user.getUsername())
                .queryParam("email", user.getEmail() != null ? user.getEmail() : "")
                .queryParam("role", user.getRole().name())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
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
        return user.getAttribute("email");
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
}
