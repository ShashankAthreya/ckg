const fs = require('fs');
const ParserN3 = require('@rdfjs/parser-n3');
const SerializerJsonLd = require('@rdfjs/serializer-jsonld');

const inputTurtle = fs.readFileSync('/Users/sam/Documents/VU/Thesis/Code/data.ttl', 'utf8');

const context = {
  '@base': 'http://localhost:8080/',
  '@vocab': 'http://localhost:8080/',
};

const parser = new ParserN3();
const serializer = new SerializerJsonLd({ context });

const inputStream = parser.import(inputTurtle);
const outputStream = serializer.import(inputStream);

const jsonLdChunks = [];
outputStream.on('data', (chunk) => {
  jsonLdChunks.push(chunk);
});

outputStream.on('end', () => {
  const jsonLd = JSON.stringify({ '@graph': jsonLdChunks }, null, 2);
  fs.writeFileSync('data.json', jsonLd);
});

outputStream.on('error', (error) => {
  console.error('Error converting RDF to JSON-LD:', error);
});
