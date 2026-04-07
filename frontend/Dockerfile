FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_URL é passado como build arg para que o Vite inclua a URL da API no bundle
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
# CACHEBUST invalida o cache do Docker a cada deploy para garantir rebuild completo
ARG CACHEBUST=1
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
# Railway injeta a variável PORT; envsubst substitui ${PORT} no template em runtime
ENV PORT=80
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
