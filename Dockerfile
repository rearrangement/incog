FROM denoland/deno:debian-2.1.4

WORKDIR /app

COPY package*.json .
COPY deno.jsonc .
COPY . .

RUN apt update
RUN apt install -y python3 python3-pip libssl-dev build-essential python3-dev nodejs
RUN cp -n config.example.toml config.toml
RUN deno install --allow-scripts
RUN deno task build
RUN export TERM=xterm-256color
ENV PORT="8000" # this is to make sure it's set at 8000.
VOLUME /app
EXPOSE 8000
ENTRYPOINT ["deno"]
CMD ["task", "start", "--color"]
