FROM node:10

RUN openssl genrsa -out orekey.pem 1024 && \
    openssl req -new -key orekey.pem -subj "/C=JP/ST=Tokyo-to/L=Shibuya/O=Company Name/OU=IT dept./CN=Company Dept CA" > orekey.csr && \
    openssl x509 -req -in orekey.csr -signkey orekey.pem -out orekey.cert

# アプリケーションディレクトリを作成する
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "index.js" ]