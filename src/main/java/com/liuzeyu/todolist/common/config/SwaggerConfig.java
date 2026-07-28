package com.liuzeyu.todolist.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger / OpenAPI 配置
 * <p>
 * 配置 API 文档信息（标题、版本、联系方式）以及全局 Bearer JWT 安全方案。
 * 所有 API 默认需要 Bearer token 认证，UI 上可通过 Authorize 按钮统一设置。
 */
@Configuration
public class SwaggerConfig {

    /**
     * 自定义 OpenAPI 元信息
     *
     * @return 配置完成的 OpenAPI 实例
     */
    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        
        return new OpenAPI()
                .info(new Info()
                        .title("Todolist API")
                        .description("清单应用API文档")
                        .version("v1.0")
                        .contact(new Contact()
                                .name("Lingma")
                                .email("support@example.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
