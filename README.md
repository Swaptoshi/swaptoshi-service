![Logo](./docs/assets/banner_service.png)

# Swaptoshi Service

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0)
![GitHub repo size](https://img.shields.io/github/repo-size/swaptoshi/swaptoshi-service)

**Swaptoshi Service is created based on [Klayr Service v0.7.7](https://github.com/KlayrHQ/klayr-service/tree/v0.7.7) and adapted to the Swaptoshi Blockchain.**

Swaptoshi Service is a web application middleware that allows interaction with various blockchain networks based on the Klayr protocol.

The main focus of Swaptoshi Service is to provide data to the UI clients such as Klayr Desktop. It allows accessing the live blockchain data similarly to the regular Klayr SDK API, albeit with more comprehensive features. Furthermore, Swaptoshi Service also provides users with much more detailed information and endpoints, such as geolocation, network usage statistics, and more.

The project is a Microservices-based implementation. The technical stack design helps deliver several micro-services, whereby each one is responsible for a particular functionality. The data is served in JSON format and exposed by a public RESTful or a WebSocket-based RPC API.

## Available Services

Swaptoshi Service comprises of multiple microservices that can operate independently of each other. The Gateway is required to expose the APIs provided by the specific services.

Every microservice is independently managed and placed in a separate directory under the [`services`](services) directory. They contain their own `package.json` and `Dockerfile` that are beneficial when running the applications.

| Service                                                   | Description                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Gateway](services/gateway)                               | The Gateway exposes the API for Swaptoshi Service users to access and use over HTTP and WS protocols. Its main purpose is to proxy API requests from users to the concerned Swaptoshi Service microservices. It provides the users with a central point of data access that ensures existing application compatibility.                                                                |
| [Connector](services/blockchain-connector)                | The Blockchain Connector connects with the node running a Klayr protocol-compliant blockchain application. It is primarily responsible for data transformation and caching, thus reducing the number of calls made to the node.                                                                                                                                                |
| [Coordinator](services/blockchain-coordinator)            | The Blockchain Coordinator service is primarily responsible for ensuring the completeness of the index. It performs periodic checks for any gaps in the index and schedules tasks to update it, along with the latest block updates.                                                                                                                                           |
| [Indexer](services/blockchain-indexer)                    | The Blockchain Indexer service, in the indexing mode, is primarily responsible to update the index, based on the scheduled jobs by the Blockchain Coordinator. In the data service mode, it serves user request queries made via the RESTful API or WebSocket-based RPC calls. It can run both the indexer and data service modes simultaneously, which is enabled by default. |
| [App Registry](services/blockchain-app-registry)          | The Blockchain Application Registry service is primarily responsible for regularly synchronizing and providing off-chain metadata information for known blockchain applications in the Klayr ecosystem. The metadata is maintained in the Klayr [Application Registry](https://github.com/KlayrHQ/app-registry) repository.                                                    |
| [Fee Estimator](services/fee-estimator)                   | The Fee Estimator service implements the [dynamic fee system](https://github.com/KlayrHQ/lips/blob/main/proposals/lip-0013.md) algorithm to offer users transaction fee recommendations based on the network traffic.                                                                                                                                                          |
| [Transaction Statistics](services/transaction-statistics) | The Transaction Statistics service, as the name suggests, is primarily responsible to compute various transaction statistics to offer users various real-time network insights.                                                                                                                                                                                                |
| [Market](services/market)                                 | The Market service allows price data retrieval. It supports multiple sources to keep the current Klayr token price up-to-date and available to the clients in real time.                                                                                                                                                                                                       |
| [Export](services/export)                                 | The Export service enables users to download the transaction history as a CSV file for any given account on the blockchain.                                                                                                                                                                                                                                                    |
| [Template](services/template)                             | The Template service is an abstract microservice from which all Swaptoshi Service services are inherited. It allows all services to share a similar interface and design pattern. Its purpose is to reduce code duplication and increase consistency between each service, hence, simplifying code maintenance and testing.                                                        |

**Remarks**

- Swaptoshi Service by default attempts to connect to a local node via WebSocket on port `7887` or IPC on `~/.klayr/klayr-core` by default.
- The default installation method is based on Docker.
- Some token conversion rates in the Market service require their API keys.
- For the events information to be always available in the API, please set `system.keepEventsForHeights: -1` in the Klayr application node config.
- It is highly recommended to _NOT_ enable any plugins on the Klayr application node when running Swaptoshi Service against it. Enabling them can cause performance issues in Swaptoshi Service.

## Architecture Diagram

Inter-microservice communications are enabled with a message broker, typically an instance of Redis or NATS.

![Swaptoshi Service Architecture](./docs/assets/architecture.png)

## API documentation

The Gateway service provides the following APIs, which all users of Swaptoshi Service can access and use.

| API                                                  | Description                                                                                                                                                                                                                                         |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [HTTP API](docs/api/version3.md)                     | HTTP API is the public RESTful API that provides blockchain data in standardized JSON format.                                                                                                                                                       |
| [WebSocket JSON-RPC API](docs/api/version3.md)       | The WebSocket-based JSON-RPC API provides blockchain data in standardized JSON format. The API uses the Socket.IO library and is compatible with JSON-RPC 2.0 standards.                                                                            |
| [Subscribe API](docs/api/websocket_subscribe_api.md) | The Subscribe API is an event-driven API. It uses a two-way streaming connection, which can notify the client about new data instantly as it arrives. It is responsible for updating users regarding changes in the blockchain network and markets. |

## Installation

The default port for REST API requests and Socket.IO-based communication is `9901`. The API is accessible through the URL `http://127.0.0.1:9901` when running locally. The REST API is accessible via HTTP clients such as [Postman](https://www.postman.com/), [cURL](https://curl.haxx.se/) and [HTTPie](https://httpie.org/).

WebSocket-based APIs can be used through the [Socket.IO](https://socket.io/) library available for many modern programming languages and frameworks.

To continue the installation ensure that you have the following dependencies installed:

- [NodeJS Active LTS - ^v18.20.2](https://nodejs.org/en/about/releases/)
- [MySQL - ^v8.0.29](https://dev.mysql.com/doc/relnotes/mysql/8.0/en/)
- [Docker](https://www.docker.com/) with [Docker compose](https://docs.docker.com/compose/install/)
- [GNU Make](https://www.gnu.org/software/make/) and [GNU Tar](https://www.gnu.org/software/tar/)

Follow the instructions listed below, to acquire detailed information regarding the installation of required dependencies for various operating systems.

- [Ubuntu 18.04 LTS Bionic Beaver](./docs/prerequisites_docker_ubuntu.md)
- [Ubuntu 20.04 LTS Focal Fossa](./docs/prerequisites_docker_ubuntu.md)
- [Debian 10 Buster](./docs/prerequisites_docker_debian.md)
- [MacOS 10.15 Catalina](./docs/prerequisites_docker_macos.md)

Retrieve the latest release from the [official repository](https://github.com/KlayrHQ/klayr-service/releases).

Unpack the source code archive by executing the following commands listed below:

```bash
tar -xf klayr-service-x.y.z.tar.gz
cd klayr-service
```

> Although the above commands retrieve the entire source code, this instruction does not cover building a custom version of Swaptoshi Service. For more information refer to this document: [Building Swaptoshi Service from source](./docs/build_from_source.md)

### Docker image build (Optional)

If you wish to build the local version of Swaptoshi Service execute the following command below:

```bash
make build-images
```

> This step is only necessary if you wish to build a custom or pre-release version of Swaptoshi Service that does not have a pre-built Docker image published on the Docker Hub. The installation script chooses the last available stable version on Docker Hub, **unless** there is no local image. If you are unsure about any local builds, use the `make clean` command to remove all locally built docker images.

### System requirements

The following system requirements are recommended to start Swaptoshi Service:

#### Memory

- Machines with a minimum of 16 GB RAM for the Mainnet.
- Machines with a minimum of 16 GB RAM for the Testnet.

#### Storage

- Machines with a minimum of 40 GB HDD.

## Configuration

The default configuration is sufficient to run Swaptoshi Service against the local node.

Before running the application copy the default docker-compose environment file:

```bash
cp docker/example.env .env
```

In the next step, set the required environment variables.

```bash
$EDITOR .env
```

The example below assumes that the Klayr Core (or any Klayr protocol-compliant blockchain application) node is running on the host machine, and not inside of a Docker container.

```bash
## Required
# The local Klayr Core node WebSocket API port
export KLAYR_APP_WS="ws://host.docker.internal:7887"
```

When running a node inside of a Docker container, the variable needs to refer to the container: `KLAYR_APP_WS="ws://<your_docker_container>:7887"`.

Configuration options are described [in this document](./docs/config_options.md).

> Optional: Check your configuration with the command `make print-config`

## Management

To run the application execute the following command:

```bash
make up
```

To stop the application execute the following command:

```bash
make down
```

> Optional: It is possible to use regular docker-compose commands such as `docker-compose up -d`. Please check the `Makefile` for more examples.

## Benchmark

Assuming klayr-service is running on the `127.0.0.1:9901`, and you are in the root of this repo, you can run the following:

```bash
cd tests
KLAYR_SERVICE_URL=http://127.0.0.1:9901 yarn run benchmark
```

## Further development

The possibility to customize and build Swaptoshi Service from a local source is described in the following document [Building Swaptoshi Service from source](./docs/build_from_source.md). It may also be useful for PM2-based installations.

## Contributors

https://github.com/KlayrHQ/klayr-service/graphs/contributors

## License

Copyright 2016-2024 Lisk Foundation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[klayr documentation site]: https://klayr.xyz/documentation
