FROM ruby:2.3.0

RUN gem install jekyll

RUN apt-get update --fix-missing
RUN apt-get install -y curl
RUN apt-get install -y git
RUN apt-get install -y wget
RUN apt-get install -y python-swiftclient
RUN apt-get install -y python-keystoneclient
RUN apt-get install -y unzip

RUN curl -sL https://deb.nodesource.com/setup_0.12 | bash - && \
  apt-get install -y nodejs

RUN mkdir /logs

ADD client /blackbox/client
ADD server /blackbox/server

RUN cd /blackbox/server; npm install

# Final steps
EXPOSE 8080
CMD ["/bin/bash", "-c", "cd blackbox/server && node ./app.js"]