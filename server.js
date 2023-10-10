const express = require('express');
const app = express();
app.use(express.static('public'));
app.use(express.json());

const fuseki_url = process.env.FUSEKI_URL;

const endpoint = fuseki_url + '/ckg/sparql';

const endpoint_update = fuseki_url + '/ckg/update';

console.log("endpoint: ", endpoint)
console.log("endpoint_update: ", endpoint_update)

app.get('/query/data', async (req, res) => {
  const course = req.query.id; 
  const fetch = (await import('node-fetch')).default;

  const nodesQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?type ?id ?name ?label ?btl ?chapter (GROUP_CONCAT(DISTINCT ?objective;separator=", ") as ?objectives) ?week  
  WHERE {
    {
      ?id a ?type.
      ?id a ex:Topic ;
          ex:name ?name ;
          ex:classification_label ?label ;
          ex:in_course/ex:course ex:Course5062COPP6Y;
          ex:in_course/ex:week_id ?week;
          ex:in_course/ex:chapter ?chapter;
          ex:in_course/ex:objectives ?objective;
          ex:in_course/ex:bloom_taxonomy_level ?btl .
    } UNION {
        ?id a ?type .
          ?id a ex:Course ;
            ex:name ?name .
      FILTER (?id = ex:Course5062COPP6Y)
      } UNION {
        ?course a ex:Course;
             ex:chapters ?id.
        ?id a ?type .
          ?id a ex:Chapter ;
            ex:name ?name .
      FILTER (?course = ex:Course5062COPP6Y)
      }
    }
  
  GROUP BY ?type ?id ?name ?label ?btl ?chapter ?week  
  `;
  const linksQuery = `
  PREFIX ex: <http://localhost:8080/>
  
SELECT ?source ?target WHERE {
  {
    ?source a ex:Topic ;
      ex:in_course/ex:course ?course ;
      ex:has_topics ?target .
    ?target ex:in_course/ex:course ?course . 
    FILTER (?course = ex:Course${course})
  } UNION {
    ?source a ex:Course ;
      ex:chapters ?target .
      FILTER (?source = ex:Course${course})
  } UNION {
    ?source a ex:Chapter ;
      ex:root_topic ?target .
    ?target ex:in_course/ex:course ?course .
    FILTER (?course = ex:Course${course})
  }
}
  `;
  const subdomainQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?id ?name WHERE {
      ?id a ex:ClassificatinLabel ;
                ex:name ?name .
  }
  `;
  const domainQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?id ?name WHERE {
      ?id a ex:Domain ;
                ex:name ?name .
  }
  `;
  const courseQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?id ?name ?code (GROUP_CONCAT(DISTINCT ?root_topics;separator=", ") as ?root_topic) (GROUP_CONCAT(DISTINCT ?chapters;separator=", ") as ?chapter) WHERE {
    ?id a ex:Course ;
  		ex:name ?name ;
    	ex:course_code ?code ;
      ex:chapters ?chapters .
      ?chapters a ex:Chapter ;
        ex:root_topic ?root_topics .
      FILTER (?id = ex:Course${course})
  }GROUP BY ?id ?name ?code
  `;
  const bloomTLQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?id ?name ?value WHERE {
    ?id a ex:BloomTaxonomyLevel ;
  		ex:name ?name ;
    	ex:value ?value .
  }
  `;

  const objectiveQuery = `
  PREFIX ex: <http://localhost:8080/>
  
  SELECT ?obj ?name ?btl WHERE {
      ?course a ex:Course ;
        ex:objectives ?obj .
      ?obj a ex:CourseObjective ;
        ex:name ?name ;
        ex:bloom_taxonomy_level ?btl .
      FILTER (?course = ex:Course${course})
    }
  `;

  const chapterQuery = `
  PREFIX ex: <http://localhost:8080/>
  
  SELECT ?id ?name WHERE {
      ?course a ex:Course ;
        ex:chapters ?id .
      ?id a ex:Chapter ;
        ex:name ?name .
      FILTER (?course = ex:Course${course})
    }
  `;


  const nodesResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: nodesQuery
  });

  const linksResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: linksQuery
  });

  const subdomainResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: subdomainQuery
  });

  const domainResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: domainQuery
  });

  const courseResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: courseQuery
  });

  const objResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: objectiveQuery
  });

  const chapterResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: chapterQuery
  });
  const bloomTLResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: bloomTLQuery
  });

  const nodes = await nodesResponse.json();
  const links = await linksResponse.json();
  const subdomains = await subdomainResponse.json();
  const domains = await domainResponse.json();
  const courses = await courseResponse.json();
  const obj = await objResponse.json();
  const chapter = await chapterResponse.json();
  const bloomTLs = await bloomTLResponse.json();


function getDegree(type, btl) {
  if(type === 'Course'){
    return 15
  } else if(type === 'Chapter'){
    return 12
  } else {
    if (btl === 'BTL_Remember' ) {
      return 1
    } else if (btl === 'BTL_Understand' ) {
      return 3
    } else if (btl === 'BTL_Apply' ) {
      return 5
    } else if (btl === 'BTL_Analyse' ) {
      return 7
    } else if (btl === 'BTL_Evaluate' ) {
      return 9
    } else if (btl === 'BTL_Create' ) {
      return 10
    } 
  }
}
  res.json({
    nodes: nodes.results.bindings.map(binding => {
      let node = {
        name: binding.name ? binding.name.value : null,
        id: binding.id ? binding.id.value.replace('http://localhost:8080/', '') : null,
        type: binding.type ? binding.type.value.replace('http://localhost:8080/', '') : null,
        label: binding.label ? binding.label.value.replace('http://localhost:8080/', '') : null,
        degree: binding.btl ? getDegree(binding.type.value.replace('http://localhost:8080/', ''),binding.btl.value.replace('http://localhost:8080/', '')) : getDegree(binding.type.value.replace('http://localhost:8080/', ''),null),
        btl: binding.btl ? binding.btl.value.replace('http://localhost:8080/', '') : null,
        objectives: binding.objectives ? binding.objectives.value.split(', ').map(obj => obj.replace('http://localhost:8080/', '')) : null,
        chapter: binding.chapter ? binding.chapter.value.replace('http://localhost:8080/', '') : null,
        week: binding.week ? parseInt(binding.week.value) : null
      };
      return node;
    }),
    links: links.results.bindings.map(binding => ({ source: binding.source.value.replace('http://localhost:8080/', ''), target: binding.target.value.replace('http://localhost:8080/', '') })),
    classifications: subdomains.results.bindings.map(binding => ({ name: binding.name.value, id: binding.id.value.replace('http://localhost:8080/', '') })),
    domains: domains.results.bindings.map(binding => ({ name: binding.name.value, id: binding.id.value.replace('http://localhost:8080/', '') })),
    courses: courses.results.bindings.map(binding => ({ name: binding.name.value, id: binding.id.value.replace('http://localhost:8080/', ''), code: binding.code.value,root_topic: binding.root_topic.value.split(', ').map(obj => obj.replace('http://localhost:8080/', ''))})),
    chapters: chapter.results.bindings.map(binding => ({ name: binding.name.value, id: binding.id.value.replace('http://localhost:8080/', '')})),
    obj: obj.results.bindings.map(binding => ({ name: binding.name.value, id: binding.obj.value.replace('http://localhost:8080/', ''), btl: binding.btl.value.replace('http://localhost:8080/', '')})),
    bloomTL: bloomTLs.results.bindings.map(binding => ({ name: binding.name.value, id: binding.id.value.replace('http://localhost:8080/', ''), value: binding.value.value })),
  });
});

app.post('/delete/node', async (req, res) => {
  const nodeId = req.body.id;

  const deleteQuery = `
    PREFIX ex: <http://localhost:8080/>
    DELETE WHERE {
      ex:${nodeId} ?p ?o .
    };
    DELETE WHERE {
      ?s ?p1 ex:${nodeId} .
    };
    DELETE WHERE {
      ?s2 ex:has_topics ex:${nodeId} .
    }
  `;

  const deleteResponse = await fetch(endpoint_update, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update'
    },
    body: deleteQuery
  });

  if (deleteResponse.ok) {
    res.json({ success: true });
  } else {
    const errorText = await deleteResponse.text();
    res.json({ success: false, message: 'Failed to delete node ' + nodeId, error: errorText });
  }
});

app.post('/add/node', async (req, res) => {
  const addQuery = `
  PREFIX ex: <http://localhost:8080/>
  INSERT DATA {
      ex:${req.body.id} a ex:Topic ;
          ex:name "${req.body.name}" ;
          ex:classification_label ex:${req.body.label} ;
          ex:in_course [
              ex:course ex:${req.body.course} ;
              ex:week_id ${req.body.week};
              ex:objectives ex:${req.body.obj};
              ex:chapter ex:${req.body.chapter};
              ex:bloom_taxonomy_level ex:${req.body.btl}
          ] .
  }
  `;

  const response = await fetch(endpoint_update, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update'
    },
    body: addQuery
  });

  if (response.ok) {
    console.log("Node Added");
    res.json({ success: true });
  } else {
    const errorText = await response.text();
    res.json({ success: false, message: 'Failed to Add node ' + req.body.id, error: errorText });
  }
});

app.get('/node/details', async (req, res) => {
  const nodeId = req.query.id; 

  const courseInfo = `
  PREFIX ex: <http://localhost:8080/>
  SELECT 
    (REPLACE(STR(?course), "http://localhost:8080/", "") as ?courseStr) 
    (REPLACE(STR(?btl), "http://localhost:8080/", "") as ?btlStr) 
  WHERE {
    ex:${nodeId} ex:in_course ?inCourseNode .
    ?inCourseNode ex:course ?course ;
                 ex:bloom_taxonomy_level ?btl .
  }  
  `;

  const generalInfo = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?id ?name ?subDomain WHERE{
    ?id a ex:Topic;
        ex:name ?name;
        ex:classification_label ?subDomain
        FILTER (?id = ex:${nodeId})
  }
  `;

  const parentInfo = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?id WHERE{
    ?id a ex:Topic;
        ex:has_topics ex:${nodeId} .
    ex:${nodeId} a ex:Topic .
  }
  `;

  const childrenInfo = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?topics WHERE{
    ex:${nodeId} a ex:Topic;
        ex:has_topics ?topics .
    ?topics a ex:Topic .
  }
  `;

  const courseResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: courseInfo
  });

  const parentsRespone = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: parentInfo
  });

  const childrenResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: childrenInfo
  });
  
  const generalRespone = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: generalInfo
  });

  const parentResponseBody = await parentsRespone.json();
  const courseResponseBody = await courseResponse.json();
  const childrenResponseBody = await childrenResponse.json();
  const generalResponeBody = await generalRespone.json();
  
  res.json({
    node: generalResponeBody.results.bindings.map(binding => ({ name: binding.name.value, id: binding.id.value.replace('http://localhost:8080/', ''), subDomain: binding.subDomain.value.split(', ').map(sd => sd.replace('http://localhost:8080/', ''))})),
    courses: courseResponseBody.results.bindings.map(binding => ({id: binding.courseStr.value.replace('http://localhost:8080/', ''), btl: binding.btlStr.value})),
    parents: parentResponseBody.results.bindings.map(binding => ({id: binding.id.value.split(', ').map(sd => sd.replace('http://localhost:8080/', ''))})),
    children: childrenResponseBody.results.bindings.map(binding => ({id: binding.topics.value.split(', ').map(sd => sd.replace('http://localhost:8080/', ''))})),
  });
});

app.get('/course/details', async (req, res) => {

  const detailsQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?course ?courseName WHERE {
    ?course a ex:Course .
    ?course ex:name ?courseName .
  }
  `;

  const courseResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: detailsQuery
  });

  const courses = await courseResponse.json();
  res.json({
    courses: courses.results.bindings.map(binding => ({ name: binding.courseName.value, id: binding.course.value.replace('http://localhost:8080/', '')})),
  });
});

app.post('/node/connect', async (req, res) => {
  const parent = req.body.parent;
  const child = req.body.child;

  const addQuery = `
  PREFIX ex: <http://localhost:8080/>

  INSERT {
      ex:${parent} ex:has_topics ex:${child} .
  }
  WHERE {
      ex:${parent} a ex:Topic .
}
  `;

  const response = await fetch(endpoint_update, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update'
    },
    body: addQuery
  });

  if (response.ok) {
    res.json({ success: true });
    // console.log("Parent Added")
  } else {
    const errorText = await response.text();
    res.json({ success: false, message: 'Failed to Add Parent node ' + parent, error: errorText });
  }
});

app.post('/node/unlink', async (req, res) => {
  const parent = req.body.parent;
  const child = req.body.child;

  const addQuery = `
  PREFIX ex: <http://localhost:8080/>

  DELETE {
      ex:${parent} ex:has_topics ex:${child} .
  }
  WHERE {
      ex:${parent} ex:has_topics ex:${child} .
  }
  `;

  const response = await fetch(endpoint_update, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update'
    },
    body: addQuery
  });

  if (response.ok) {
    res.json({ success: true });
    console.log("Parent Added")
  } else {
    const errorText = await response.text();
    res.json({ success: false, message: 'Failed to Add Parent node ' + nodeId, error: errorText });
  }
});

app.get('/course/objective', async (req, res) => {
  const course = req.query.id; 

  const courseDetailsQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT 
      ?subDomain 
      ?totalTopicsInSubDomain 
      ?taxonomyLevel 
      ?taxonomyTopicCount
      ((?taxonomyTopicCount * 1.0 / ?totalTopicsInSubDomain) AS ?percentage)
  WHERE {
      {
          # This subquery calculates the total number of topics in each subdomain
          SELECT ?subDomain (COUNT(DISTINCT ?topic) AS ?totalTopicsInSubDomain)
          WHERE {
              ?topic a ex:Topic ;
                    ex:in_course/ex:course ex:Course${course} ;
                    ex:in_course/ex:chapter ?subDomain .
          }
          GROUP BY ?subDomain
      }
      {
          # This subquery counts the number of topics per taxonomy level
          SELECT ?subDomain ?taxonomyLevel (COUNT(DISTINCT ?topic) AS ?taxonomyTopicCount)
          WHERE {
              ?topic a ex:Topic ;
                    ex:in_course/ex:course ex:Course${course} ;
                    ex:in_course/ex:bloom_taxonomy_level ?taxonomyLevel ;
                    ex:in_course/ex:chapter ?subDomain .
          }
          GROUP BY ?subDomain ?taxonomyLevel
      }
  }
  ORDER BY ?subDomain ?taxonomyLevel
  `;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: courseDetailsQuery
  });

  const responseBody = await response.json();
  
  // Extract the results
  const bindings = responseBody.results.bindings;
  
  // Process the results to the desired structure:
  const processedData = {};

  bindings.forEach(row => {
      const subDomain = row.subDomain.value.replace('http://localhost:8080/', '');
      const totalTopicsInSubDomain = parseInt(row.totalTopicsInSubDomain.value, 10);
      const taxonomyLevel = row.taxonomyLevel.value.replace('http://localhost:8080/', '');
      const taxonomyTopicCount = parseInt(row.taxonomyTopicCount.value, 10);
      
      if (!processedData[subDomain]) {
          processedData[subDomain] = {
              id: subDomain,
              topicCount: totalTopicsInSubDomain,
              taxonomy: []
          };
      }

      processedData[subDomain].taxonomy.push({
          TaxonomyLevel: taxonomyLevel,
          count: taxonomyTopicCount
      });
  });

  // Construct final structure
  const finalResponse = {
      Subdomain: Object.values(processedData)
  };
  
  if (bindings.length > 0) {
    res.json(finalResponse)
  } else {
    res.json({ message: "No data found for the provided Course." });
  }
});

app.get('/query/subdomain/topics', async (req, res) => {
  const nodesQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?id ?name ?subDomain WHERE {
    ?id a ex:Topic ;
          ex:name ?name ;
          ex:classification_label ?subDomain .
  }  
  `;
  const subdomainQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?id ?name WHERE {
      ?id a ex:ClassificatinLabel ;
                ex:name ?name .
  }`;
  
  const nodesResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: nodesQuery
  });

  const subdomainResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: subdomainQuery
  });

  const nodes = await nodesResponse.json();
  const subdomains = await subdomainResponse.json();

  res.json({
    nodes: nodes.results.bindings.map(binding => ({ name: binding.name.value, id: binding.id.value.replace('http://localhost:8080/', ''), subDomain: binding.subDomain.value.split(', ').map(sd => sd.replace('http://localhost:8080/', ''))})),
    subdomains: subdomains.results.bindings.map(binding => ({ name: binding.name.value, id: binding.id.value.replace('http://localhost:8080/', '') })),
  });
});

app.post('/add/subdomain', async (req, res) => {
  const addQuery = `
  PREFIX ex: <http://localhost:8080/>
  INSERT DATA {
      ex:CL_${req.body.id} a ex:ClassificatinLabel ;
          ex:name "${req.body.name}" ;
          ex:domain ex:DomainComputerScience .
  }
  `;

  const response = await fetch(endpoint_update, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update'
    },
    body: addQuery
  });

  if (response.ok) {
    console.log("Node Added");
    res.json({ success: true });
  } else {
    const errorText = await response.text();
    res.json({ success: false, message: 'Failed to Add node ' + req.body.id, error: errorText });
  }
});

app.post('/add/course', async (req, res) => {
  const subdomains = req.body.subdomains; 
  const rootTopics = req.body.rootTopics; 
  console.log("HERE");
  const subdomainValues = subdomains.map(sd => `ex:${sd}`).join(', ');
  const rootTopicValues = rootTopics.map(rt => `ex:${rt}`).join(', ');
  console.log(subdomainValues);
  const addQuery = `
  PREFIX ex: <http://localhost:8080/>
  INSERT DATA {
      ex:Course${req.body.id} a ex:Course ;
          ex:name "${req.body.name}" ;
          ex:course_code "${req.body.id}";
          ex:classification_label ${subdomainValues};
          ex:root_topic ${rootTopicValues} .
  }
  `;

  const response = await fetch(endpoint_update, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update'
    },
    body: addQuery
  });

  if (response.ok) {
    console.log("Course Added");
    res.json({ success: true });
  } else {
    const errorText = await response.text();
    res.json({ success: false, message: 'Failed to Add Course ' + req.body.id, error: errorText });
  }
});

app.get('/node/in-course', async (req, res) => {
  const nodeId = req.query.id;
  const courseCode = req.query.course;

  const checkQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?btl WHERE {
    ex:${nodeId} a ex:Topic;
                ex:in_course [
                    ex:course ex:Course${courseCode};
                    ex:bloom_taxonomy_level ?btl 
                ] .
  }  
  `;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: checkQuery
  });

  const responseBody = await response.json();
  const bindings = responseBody.results.bindings;
  
  if (bindings.length > 0) {
    res.json({
      nodeExists: true,
      inCourse: true,
      btl: bindings[0].btl.value.replace('http://localhost:8080/', '')
    });
  } else {
    res.json({ inCourse: false,  
      nodeExists: false });
  }
});

app.post('/add/course-to-node', async (req, res) => {
  const { nodeId, courseCode, newBTL } = req.body;
  console.log(nodeId, courseCode, newBTL);

  const addQuery = `
  PREFIX ex: <http://localhost:8080/>
  INSERT DATA {
    ex:${nodeId} ex:in_course [
        ex:course ex:${courseCode};
        ex:bloom_taxonomy_level ex:${newBTL} 
    ] .
  }
  `;
  const response = await fetch(endpoint_update, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update'
    },
    body: addQuery
  });

  if (response.ok) {
    console.log("Course Added to Node");
    res.json({ success: true });
  } else {
    const errorText = await response.text();
    res.json({ success: false, message: 'Failed to Add course to node ' + req.body.id, error: errorText });
  }
});

app.post('/delete/course-from-node', async (req, res) => {
  const { nodeId, courseCode } = req.body;

  const deleteQuery = `
  PREFIX ex: <http://localhost:8080/>
  
  DELETE WHERE {
    ex:${nodeId} ex:in_course ?courseBlankNode .
    ?courseBlankNode ex:course ex:${courseCode} .
    ?courseBlankNode ex:bloom_taxonomy_level ?btl .
  }
  `;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update'
    },
    body: deleteQuery
  });

  const responseBody = await response.json();

  if (response.ok) {
    res.json({
      success: true,
      message: "Course removed from node successfully."
    });
  } else {
    res.status(400).json({
      success: false,
      message: responseBody.message || 'Failed to remove course from node.'
    });
  }
});

app.post('/update/node-subdomain', async (req, res) => {
  const { nodeId, newSubDomain } = req.body;

  const updateQuery = `
  PREFIX ex: <http://localhost:8080/>
  
  DELETE {
    ex:${nodeId} ex:classification_label ?currentSubDomain .
  }
  INSERT {
    ex:${nodeId} ex:classification_label ex:${newSubDomain} .
  }
  WHERE {
    ex:${nodeId} ex:classification_label ?currentSubDomain .
  }
  `;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update'
    },
    body: updateQuery
  });

  const responseBody = await response.json();

  if (response.ok) {
    res.json({
      success: true,
      message: "Node's subdomain updated successfully."
    });
  } else {
    res.status(400).json({
      success: false,
      message: responseBody.message || 'Failed to update node subdomain.'
    });
  }
});

app.get('/course/exists', async (req, res) => {
  const courseId = req.query.id;

  const checkQuery = `
  PREFIX ex: <http://localhost:8080/>
  ASK {
    ex:Course${courseId} a ex:Course .
  }  
  `;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: checkQuery
  });

  const responseBody = await response.json();

  res.json({
    exists: responseBody.boolean // true if exists, false otherwise
  });
});

app.get('/connection/exists', async (req, res) => {
  const sourceId = req.query.source;
  const targetId = req.query.target;

  const checkQuery = `
  PREFIX ex: <http://localhost:8080/>
  ASK {
    ex:${sourceId} ex:has_topics ex:${targetId} .
  }  
  `;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: checkQuery
  });

  const responseBody = await response.json();

  res.json({
    exists: responseBody.boolean // true if exists, false otherwise
  });
});

app.get('/node/course-and-links', async (req, res) => {
  const nodeId = req.query.id; 

  const detailsQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT 
    (REPLACE(STR(?course), "http://localhost:8080/", "") as ?courseStr) 
    (REPLACE(STR(?btl), "http://localhost:8080/", "") as ?btlStr) 
  WHERE {
    ex:${nodeId} ex:in_course ?inCourseNode .
    ?inCourseNode ex:course ?course ;
                 ex:bloom_taxonomy_level ?btl .
  }  
  `;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: detailsQuery
  });

  const responseBody = await response.json();
  
  // Extract the results
  const bindings = responseBody.results.bindings;
  
  if (bindings.length > 0) {
    const firstResult = bindings[0];
    const course = firstResult.courseStr.value;
    const btl = firstResult.btlStr.value;

    // Format the response
    res.json({
      course: course,
      btl: btl
    });
  } else {
    res.json({ message: "No data found for the provided node ID." });
  }
});

app.post('/node/remove/course', async (req, res) => {
  const nodeId = req.body.id;
  const course = req.body.course;

  const deleteQuery = `
  PREFIX ex: <http://localhost:8080/>
  DELETE WHERE {
    ex:${nodeId} ex:in_course ?bnode .
    ?bnode ex:course ex:${course} ;
           ex:bloom_taxonomy_level ?btl .
  }  
  `;

  const deleteResponse = await fetch(endpoint_update, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update'
    },
    body: deleteQuery
  });

  if (deleteResponse.ok) {
    res.json({ success: true });
  } else {
    const errorText = await deleteResponse.text();
    res.json({ success: false, message: 'Failed to delete node ' + nodeId, error: errorText });
  }
});

app.post('/add/learningLine', async (req, res) => {
  const addQuery = `
  PREFIX ex: <http://localhost:8080/>
  INSERT DATA {
      ex:LearningLine${req.body.id} a ex:LearningLine ;
          ex:name "${req.body.name}" .
  }
  `;

  const response = await fetch(endpoint_update, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-update'
    },
    body: addQuery
  });

  if (response.ok) {
    console.log("Learning Line Added");
    res.json({ success: true });
  } else {
    const errorText = await response.text();
    res.json({ success: false, message: 'Failed to Add Learning Line ' + req.body.id, error: errorText });
  }
});

app.get('/query/learningLines', async (req, res) => {
  
  const learningLinesQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?id ?name WHERE {
      ?id a ex:LearningLine ;
                ex:name ?name .
  }`;
  const subdomainResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: learningLinesQuery
  });

  const learningLines = await subdomainResponse.json();

  res.json({
    learningLines: learningLines.results.bindings.map(binding => ({ name: binding.name.value, id: binding.id.value.replace('http://localhost:8080/', '') })),
  });
});

app.get('/query/trajectory/topic', async (req, res) => {
  
  const topicTrajectoryQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?id ?name WHERE {
    ?id a ex:Course;
        ex:classification_label ex:${req.query.subDomain};
        ex:name ?name .
    ex:${req.query.topic} a ex:Topic;
       ex:in_course/ex:course ?id.
  }
  `;
console.log(req)
  const trajectoryResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: topicTrajectoryQuery
  });

  const trajectory = await trajectoryResponse.json();

  res.json({
    trajectory: trajectory.results.bindings.map(binding => ({ name: binding.name.value, id: binding.id.value.replace('http://localhost:8080/Course', '') })),
  });
});


app.get('/query/trajectory/domain', async (req, res) => {
  const domainTrajectoryQuery = `
  PREFIX ex: <http://localhost:8080/>
  SELECT ?id ?name WHERE {
    ?id a ex:Course;
        ex:classification_label ex:${req.query.subDomain};
        ex:name ?name .
  }
  `;
  const trajectoryResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query'
    },
    body: domainTrajectoryQuery
  });

  const trajectory = await trajectoryResponse.json();

  res.json({
    trajectory: trajectory.results.bindings.map(binding => ({ name: binding.name.value, id: binding.id.value.replace('http://localhost:8080/Course', '') })),
  });
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
