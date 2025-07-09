FROM node:24-alpine
RUN apk add --no-cache bash
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn
COPY . .
CMD ["yarn", "dev"]
# RUN apk add --no-cache bash
# RUN corepack enable && corepack prepare yarn@stable --activate
# WORKDIR /app
# COPY package.json yarn.lock ./
# RUN yarn install --immutable
# COPY . .
# RUN yarn build
# EXPOSE 3000
# CMD ["yarn", "dev"]
