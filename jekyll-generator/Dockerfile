FROM ruby:2.3.0

RUN gem install jekyll jekyll-paginate jekyll-gist

RUN apt-get update --fix-missing
RUN apt-get install -y curl
RUN apt-get install -y git
RUN apt-get install -y wget
RUN apt-get install -y python-swiftclient
RUN apt-get install -y python-keystoneclient
RUN apt-get install -y unzip

ENV NODE_VERSION 6.9.1
RUN curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz" \
  && tar -xzf "node-v$NODE_VERSION-linux-x64.tar.gz" -C /usr/local --strip-components=1 \
  && rm "node-v$NODE_VERSION-linux-x64.tar.gz"

RUN mkdir /logs

ADD client /blackbox/client
ADD server /blackbox/server

RUN cd /blackbox/server; npm install

# Final steps
EXPOSE 8080
CMD ["/bin/bash", "-c", "cd blackbox/server && node ./app.js"]
