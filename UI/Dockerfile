# Use NGINX to serve static files
FROM nginx:alpine

# Create the directory structure first
RUN mkdir -p /usr/share/nginx/html/UI /usr/share/nginx/html/assets

# Copy UI files
COPY . /usr/share/nginx/html/UI

# Copy assets from parent directory (run from UI folder, so .. goes to parent)
# We'll create a simpler approach - copy everything then organize
WORKDIR /usr/share/nginx/html

# Copy the project structure properly - we need to build from root, not UI
# So we'll modify the approach

# Create custom NGINX config
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index UI/index.html; \
    \
    # Redirect root to UI \
    location = / { \
        return 301 /UI/; \
    } \
    \
    # Serve UI files \
    location /UI/ { \
        try_files $uri $uri/ /UI/index.html; \
    } \
    \
    # Serve assets from UI/../assets (fallback) \
    location /assets/ { \
        alias /usr/share/nginx/html/UI/../assets/; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Alternative assets location within UI \
    location /UI/assets/ { \
        alias /usr/share/nginx/html/UI/../assets/; \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Handle .html extension \
    location ~ \.html$ { \
        expires 1h; \
        add_header Cache-Control "public"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"] 