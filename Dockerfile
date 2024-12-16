FROM denoland/deno:debian-2.1.4

WORKDIR /app

COPY package*.json .
COPY deno.jsonc .
COPY . .

RUN apt update
RUN apt install -y python3 python3-pip libssl-dev build-essential python3-dev nodejs
RUN echo $(node -v)
RUN deno install --allow-scripts
RUN deno task build

EXPOSE 8000
ENTRYPOINT ["deno"]
CMD ["task", "start"]
