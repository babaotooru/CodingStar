package com.onlinejudge.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.util.HashMap;
import java.util.Map;

public class FrontendAwareOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private static final String FRONTEND_ATTRIBUTE = "frontend_url";

    private final OAuth2AuthorizationRequestResolver delegate;

    public FrontendAwareOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository,
                "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return customize(delegate.resolve(request), request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return customize(delegate.resolve(request, clientRegistrationId), request);
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request) {
        if (authorizationRequest == null) {
            return null;
        }

        String frontendUrl = request.getParameter("frontend");
        if (frontendUrl == null || frontendUrl.isBlank()) {
            return authorizationRequest;
        }

        Map<String, Object> attributes = new HashMap<>(authorizationRequest.getAttributes());
        attributes.put(FRONTEND_ATTRIBUTE, frontendUrl);

        return OAuth2AuthorizationRequest.from(authorizationRequest)
                .attributes(attrs -> attrs.putAll(attributes))
                .build();
    }
}