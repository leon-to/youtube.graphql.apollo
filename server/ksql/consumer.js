/* Copyright 2020 Confluent Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * =============================================================================
 *
 * Consume messages from Confluent Cloud
 * Using the node-rdkafka client for Apache Kafka
 *
 * =============================================================================
 */

const Kafka = require('node-rdkafka');
const { configFromCli } = require('./config');
const { v4 } = require('uuid') 
const fs = require('fs')

function createConsumer(config, onData) {
  const consumer = new Kafka.KafkaConsumer({
    'bootstrap.servers': config['bootstrap.servers'],
    'sasl.username': config['sasl.username'],
    'sasl.password': config['sasl.password'],
    'security.protocol': config['security.protocol'],
    'sasl.mechanisms': config['sasl.mechanisms'],
    // 'group.id': v4()
    'group.id': 'leon'
  }, {
    // 'auto.offset.reset': 'earliest'
    'auto.offset.reset': 'latest'
  });

  return new Promise((resolve, reject) => {
    consumer
      .on('ready', () => resolve(consumer))
      .on('data', onData);

    consumer.connect();
  });
}

async function consumerExample() {
  const config = await configFromCli();

  if (config.usage) {
    return console.log(config.usage);
  }

  console.log(`Consuming records from ${config.topic}`);

  let db = []
  fs.writeFileSync('db/videos.json', JSON.stringify(db, null, 2));

  const consumer = await createConsumer(config, ({key, value, partition, offset}) => {
    let data = JSON.parse(value.toString());
    console.log(data)
    db.push(data)
    fs.writeFileSync('db/videos.json', JSON.stringify(db, null, 2));
  });

  consumer.subscribe([config.topic]);
  consumer.consume();

  process.on('SIGINT', () => {
    console.log('\nDisconnecting consumer ...');
    consumer.disconnect();
  });
}

consumerExample()
  .catch((err) => {
    console.error(`Something went wrong:\n${err}`);
    process.exit(1);
  });
