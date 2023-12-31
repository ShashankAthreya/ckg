function _chart(graph, d3, width, DOM, _, drag) {
  document.getElementById("course_info").innerHTML = "Course: " + graph.courses[0].name + " - " + graph.courses[0].code;
  let selectedNodes = [];
  const radiusExtent = [5, 18],
    linkExtent = [1, 10],
    height = (graph.nodes.length < 1200 ? 1400 : graph.nodes.length * 12);

  const simulation = d3.forceSimulation(graph.nodes)
    .force("link", d3.forceLink(graph.links).id(d => d.id))
    .force("charge", d3.forceManyBody().strength(-25))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(function (d) { return 50; }).strength(.5).iterations(1));

  // const svg = d3.select(DOM.svg(width, height)).selectAll("*").remove();
  const svg = d3.select(DOM.svg(width, height));
  svg.selectAll("*").remove();
  defineSVGFilters(svg);

  var linkStrokeScale = d3.scaleLinear(d3.extent(_.map(graph.links, 'weight')), linkExtent);

  const link = svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.8)
    .selectAll("line")
    .data(graph.links)
    .join("line")
    .attr("stroke-width", d => linkStrokeScale(+d.weight));
  fetchDropdownData();
  var nodeRadiusScale = d3.scaleLinear(d3.extent(_.map(graph.nodes, 'degree')), radiusExtent),
    neighbors = _.map(_.map(graph.nodes, 'id'), function (id) {
      var listNodes = _(graph.links)
        .filter(d => (d.source.id == id || d.target.id == id))
        .map(d => d.source.id == id ? d.target.id : d.source.id)
        .value()
      listNodes.push(id);
      return { 'id': id, 'list': listNodes };
    }),
    nodeNeighbors = _.mapValues(_.keyBy(neighbors, 'id'), 'list');


  const display = svg.append("text")
    .attr("x", 10)
    .attr("y", height - 10)
    .attr("font-family", "Arial")
    .attr("font-size", "16px");


  function processSelectedNodes() {
    let subdomainCounts = {};
    selectedNodes.forEach(node => {
      node.subDomains.forEach(subdomain => {
        if (subdomainCounts[subdomain]) {
          subdomainCounts[subdomain]++;
        } else {
          subdomainCounts[subdomain] = 1;
        }
      });
    });
    const maxCount = Math.max(...Object.values(subdomainCounts));
    const mostOccurringSubdomains = Object.keys(subdomainCounts).filter(subdomain => subdomainCounts[subdomain] === maxCount);
    display.text(`[Learning Trajectory Analysis] Recommended Domain: ${mostOccurringSubdomains.join(', ')}`);
    updateButtonState()
  }
  let btn = document.getElementById('deleteNode');
  let btn0 = document.getElementById('addNode');
  let btn1 = document.getElementById('updateNode');
  let btn2 = document.getElementById('addSelectedLink');
  let btn3 = document.getElementById('linkNodes');
  let btn4 = document.getElementById('removeSelectedLink');
  let btn5 = document.getElementById('unlinkNodes');

  function updateButtonState() {
    if (selectedNodes.length === 0) {
      btn3.removeAttribute('disabled');
      btn5.removeAttribute('disabled');
    } else {
      btn3.setAttribute('disabled', 'true');
      btn5.setAttribute('disabled', 'true');
    }
    if (selectedNodes.length >= 1) {
      btn0.setAttribute('disabled', 'true');
      btn.removeAttribute('disabled');
    } else {
      btn0.removeAttribute('disabled');
      btn.setAttribute('disabled', 'true');
    }
    if (selectedNodes.length === 1) {
      btn1.removeAttribute('disabled');
    } else {
      btn1.setAttribute('disabled', 'true');
    }
    if (selectedNodes.length === 2) {
      const node1 = selectedNodes[0];
      const node2 = selectedNodes[1];
      let isLinked = graph.links.some(link =>
        (link.source === node1 && link.target === node2) ||
        (link.source === node2 && link.target === node1)
      );
      if (isLinked){
        btn4.removeAttribute('disabled');
      } else {
        btn2.removeAttribute('disabled');
      }
    } else {
      btn2.setAttribute('disabled', 'true');
      btn4.setAttribute('disabled', 'true');
    }
    return
  }
  btn.addEventListener('click', function () {
    let nodeNames = selectedNodes.map(node => node.name);
    let nodeList = nodeNames.map(name => `• ${name}`).join('\n');
    let message = `Do you really want to remove the following selected nodes from the graph?\n\n${nodeList}`;
    let isConfirmed = confirm(message);
    if (isConfirmed) {
      const selectedNodeIds = selectedNodes.map(node => node.id);
      // console.log(selectedNodeIds);
      selectedNodeIds.forEach(unlinkNodeFromCourse);
      message = `The non-root nodes have been deleted. Click to refresh.`;
      confirm(message)
      location.reload(true);
    }
  });
  function defineSVGFilters(svg) {
    svg.append("defs")
      .append("filter")
      .attr("id", "redGlow")
      .append("feGaussianBlur")
      .attr("stdDeviation", 2.5)
      .attr("result", "coloredBlur");

    const feMerge = svg.select("#redGlow")
      .append("feMerge");

    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
  }
  async function unlinkNodeFromCourse(nodeID) {
    try {
        const response = await fetch('/node/remove/course', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: nodeID, course: "Course" + graph.courses[0].code})
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(nodeID, 'Node deleted from course successfully.');
            return true;
        } else {
            if (data.message) {
                confirm(nodeID + ' is a root node and cannot be deleted.');
            } else {
                console.log('Error:', data.message);
            }
            return false;
        }
    } catch (err) {
        console.error('Error while deleting node from course:', err);
        throw err;  
    }
}
  async function nodeDeletion(nodeID) {
    try {
        const response = await fetch('/delete/node', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: nodeID })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(nodeID, 'Node deleted successfully.');
            return true;
        } else {
            if (data.message) {
                confirm(nodeID + ' is a root node and cannot be deleted.');
            } else {
                console.log('Error:', data.message);
            }
            return false;
        }
    } catch (err) {
        console.error('Error while deleting node:', err);
        throw err;  
    }
}

  async function nodeAddition(nodeID, nodeName, nodeCourse, nodeClassification, nodeBTL, nodeChapter, nodeObjective, nodeWeek) {
    try {
        const response = await fetch('/add/node', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: nodeID, name: nodeName, course: nodeCourse, label: nodeClassification, btl: nodeBTL, chapter: nodeChapter, obj: nodeObjective, week: nodeWeek })
        });

        const data = await response.json();

        if (data.success) {
            console.log(nodeID, 'Node Added successfully.');
            var message = `The node ${nodeID} has been added.`;
            if (confirm(message)) {
                return true;
            }
        } else {
            console.log('Error:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Failed to add node:', error);
        return false;
    }
}

function nodeColouring(taxonomy){
  if (taxonomy == 'BTL_Remember') {
    return 'red';
  }
  if (taxonomy == 'BTL_Understand') {
    return 'orange';
  }
  if (taxonomy == 'BTL_Apply') {
    return 'yellow';
  }
  if (taxonomy == 'BTL_Analyse') {
    return 'green';
  }
  if (taxonomy == 'BTL_Evaluate') {
    return 'blue';
  }
  if (taxonomy == 'BTL_Create') {
    return 'violet';
  }
  return 'black';
}
let chapters = [];
graph.nodes.forEach(node => {
  if (node.type === 'Chapter') {
      chapters.push(node);
  }
});
let colors = ["#FF0000", "#0000FF", "#FFFF00", "#008000", "#FFA500", "#800080", "#00FFFF", "#FF00FF", "#00FF00", "#008080"]

let chapterColorMapping = {};
chapters.forEach((chapter, i) => {
    chapterColorMapping[chapter.id] = colors[i % colors.length];
});

let objectives = [];
graph.obj.forEach(objective => {
  objectives.push(objective);
});

// let shaders = ['#FFB6C1', '#ADD8E6', '#FFFACD', '#98FB98', '#FFE4B5', '#D8BFD8', '#B0E0E6', '#DDA0DD', '#AFEEEE', '#20B2AA'];

let shaders = ['#800000', '#008080', '#2E8B57', '#8B4513', '#8A2BE2', '#808000', '#FF4500', '#6A5ACD', '#4682B4', '#228B22'];


let objectiveColorMapping = {};
objectives.forEach((objective, i) => {
    objectiveColorMapping[objective.id] = shaders[i % shaders.length];
});
console.log(objectiveColorMapping)
function colourMapping(node) {
  if (node.type === 'Chapter') {
    return(chapterColorMapping[node.id])
  } else if (node.type === 'Topic') {
    return(chapterColorMapping[node.chapter])
  }
}

const rootNodes = graph.courses.map(course => course.root_topic);
  const node = svg.append("g")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(graph.nodes)
    .join("circle")
    .attr("r", (d) => nodeRadiusScale(+d.degree))
    .attr("stroke", "#000")
    .attr("fill", d => d.type === "Course" ? "#add8e6": colourMapping(d))
    .style("filter", d => rootNodes.includes(d.id) ? "url(#redGlow)" : null) 
    .call(drag(simulation))
    .on("mouseover", function (d) {
      node.filter(nd => !_.includes(nodeNeighbors[d.id], nd.id)).style("opacity", 0.1);
      label.filter(ld => !_.includes(nodeNeighbors[d.id], ld.id)).style("opacity", 0.1);
      link.filter(lkd => !((lkd.source.id == d.id) || (lkd.target.id == d.id))).style("opacity", 0.1);
    })
    .on("mouseout", function (d) {
      node.style("opacity", null);
      label.style("opacity", null);
      link.style("opacity", null);
    })
    .on("click", function (d) {
      // Check if the Ctrl or Cmd key is pressed
      if (d3.event.ctrlKey || d3.event.metaKey) {
        // Toggle the selection
        const index = selectedNodes.indexOf(d);
        if (index === -1) {
          selectedNodes.push(d);
          d3.select(this)
            .style("stroke", "black")
            .style("filter", "url(#redGlow)");
        } else {
          selectedNodes.splice(index, 1);
          d3.select(this)
            .style("stroke", "#000")
            .style("filter", d => rootNodes.includes(d.id) ? "url(#redGlow)" : null);
        }
        updateSelectedNodesDisplay();
        updateButtonState();
      }
    })


  function objectiveLabelColourMapping(node) {
    if (node.type !== 'Topic') {
      return("#444")
    } else if (node.type === 'Topic') {
    return(objectiveColorMapping[node.objectives[node.objectives.length - 1]])
  }
  }
  const label = svg.append("g")
  .selectAll("text")
  .data(graph.nodes)
  .join("text")
  .text(function (d) { return d.name.replace(/\_/g, " "); })
  .style("pointer-events", "none")
  .attr("dx", (d) => (nodeRadiusScale(+d.degree) + 4))
  .style("alignment-baseline", "middle")
  .style("fill", d => objectiveLabelColourMapping(d));


  function fetchDropdownData() {
    // For the first modal
    populateDropdown('topicClassification', graph.classifications);
    populateDropdown('topicObjective', graph.obj);
    populateDropdown('topicChapter', graph.chapters);
    populateDropdown('bloomTaxonomy', graph.bloomTL);

    // For the second modal (Update modal)
    populateDropdown('topicClassificationUpdate', graph.classifications);
    populateDropdown('topicObjectiveUpdate', graph.obj);
    populateDropdown('topicChapterUpdate', graph.chapters);
    populateDropdown('bloomTaxonomyUpdate', graph.bloomTL);

    populateDropdown('remSrcTopic', graph.nodes);
    populateDropdown('addSrcTopic', graph.nodes);
    
  }

  function populateDropdown(dropdownId, data) {
    const dropdown = document.getElementById(dropdownId);
    data.sort((a, b) => {
      return a.id.localeCompare(b.id);
    });

    data.forEach(item => {
        let option = document.createElement('option');
        option.text = item.id;
        dropdown.add(option);
    });
}

  document.getElementById('submitNode').addEventListener('click', function (event) {
    event.preventDefault();
    console.log("Registers Submit")
    sendSparqlQuery();
  });
  function sendSparqlQuery() {
    let nodeIDs = graph.nodes.map(node => node.id);
    // console.log(nodeIDs);
    const topicKey = document.getElementById('topicKey').value;
    if (nodeIDs.includes(topicKey)) {
      confirm("Key already exists. Update the topic or select a different Key.")
      return
    }
    const topicName = document.getElementById('topicName').value;
    const classificationLabel = document.getElementById('topicClassification').value;
    const course = graph.courses[0].id;
    const BTL = document.getElementById('bloomTaxonomy').value;
    const chapter = document.getElementById('topicChapter').value;
    const objective = document.getElementById('topicObjective').value;
    const week = document.getElementById('topicWeek').value;
    console.log(topicKey, topicName, course, classificationLabel, BTL, chapter, objective, week);
    nodeAddition(topicKey, topicName, course, classificationLabel, BTL, chapter, objective, week)
    location.reload(true);
  }
  document.getElementById('submitUpdatedNode').addEventListener('click', function (event) {
    event.preventDefault();
    sendSparqlUpdateQuery();
  });

  async function sendSparqlUpdateQuery(){
    let node_id = document.getElementById('topicUpdateKey').value
    let node_name = document.getElementById('topicUpdateName').value
    let node_course = graph.courses[0].id;
    let node_btl = document.getElementById('bloomTaxonomyUpdate').value

    let node_classification = document.getElementById('topicClassificationUpdate').value;
    let node_objective = document.getElementById('topicObjectiveUpdate').value;
    let node_chapter = document.getElementById('topicChapterUpdate').value;
    let node_week = document.getElementById('topicWeekUpdate').value;
    
    var data = await getNodeInfo(selectedNodes[0]);
    console.log(data);
  
    const result = findParentsAndChildren(selectedNodes[0].id);
    try {
      let deleteResult = await nodeDeletion(selectedNodes[0].id);
      
      if (!deleteResult) {
          throw new Error('Failed to delete node.');
      }
      
      let addResult = await nodeAddition(node_id, node_name, node_course, node_classification, node_btl, node_chapter, node_objective, node_week);
      
      if (!addResult) {
          throw new Error('Failed to add node.');
      }
      
      for (let parent of data.parents) {
          console.log(parent.id);
          await connectNodes(parent.id, node_id);
      }
      
      for (let child of data.children) {
          console.log(child.id);
          await connectNodes(node_id, child.id);
      }

      for (let course of data.courses) {
        if (course.id === node_course) {
          continue
        } else {
          console.log(course.id, course.btl);
          await addCourseAndBTLToNode(node_id, course.id, course.btl); 
        }
      }

      confirm("Node has been updated. Click to Refresh.");
      location.reload(true);
  } catch (error) {
      console.error("Error updating node:", error.message);
  }

  }
  async function addCourseAndBTLToNode(nodeId, courseCode, newBTL) {
    try {
    const response = await fetch('/add/course-to-node', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nodeId, courseCode, newBTL })
    });

    const data = await response.json();

    if (data.success) {
        console.log(data.message);
        // Handle success, maybe provide user feedback or update UI
    } else {
        console.error(data.message);
        // Handle error, maybe show an error message to the user
    }
    } catch (error) {
    console.error('Error calling server:', error);
    // Handle network or other errors, maybe show an error message to the user
    }
}
  function findParentsAndChildren(nodeId) {
    let parents = [];
    let children = [];

    graph.links.forEach(link => {
      // console.log('Checking link:', link);
        if (link.source.id === nodeId) {
            children.push(link.target.id);
        }
        if (link.target.id === nodeId) {
            parents.push(link.source.id);
        }
    });

    return {parents, children};
}

  document.getElementById('updateNode').addEventListener('click', function (event) {
    setUpdateModalValues(selectedNodes[0]);
  });
  async function setUpdateModalValues(node) {

    document.getElementById('topicUpdateKey').value = node.id;
    document.getElementById('topicUpdateName').value = node.name;
    document.getElementById('topicClassificationUpdate').value = node.label;
    document.getElementById('topicObjectiveUpdate').value = node.objectives[0];
    document.getElementById('topicChapterUpdate').value = node.chapter;
    document.getElementById('bloomTaxonomyUpdate').value = node.btl;
    document.getElementById('topicWeekUpdate').value = node.week;
    return;
  }

  async function getNodeInfo(node) {
    const response = await fetch(`/node/details?id=${node.id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    console.log(data)
    return data;
  }
  document.getElementById('addSrcTopic').addEventListener('change', function() {
    populateTargetDropdown('addTrgtTopic', this.value, 'add');
  });
  
  document.getElementById('remSrcTopic').addEventListener('change', function() {
    populateTargetDropdown('remTrgtTopic', this.value, 'remove');
  });
  
  function populateTargetDropdown(dropdownId, sourceValue, action) {
    const dropdown = document.getElementById(dropdownId);
    clearDropdown(dropdown);
  
    const allNodes = Object.keys(nodeNeighbors);
    let potentialNodes;
  
    if (action === 'add') {
      potentialNodes = allNodes.filter(node => 
        node !== sourceValue && !nodeNeighbors[sourceValue].includes(node)
      );
    } else if (action === 'remove') {
      potentialNodes = nodeNeighbors[sourceValue].filter(node => node !== sourceValue) || [];
    }
  
    potentialNodes.forEach(node => {
      let option = document.createElement('option');
      option.text = node;
      dropdown.add(option);
    });
  }
  
  function clearDropdown(dropdown) {
    while (dropdown.options.length > 1) {
      dropdown.remove(1);
    }
  }
  document.getElementById('addLinkSubmit').addEventListener('click', function (event) {
    event.preventDefault();
    let parent = document.getElementById('addSrcTopic').value
    let child = document.getElementById('addTrgtTopic').value
    connectNodes(parent,child);
    confirm(parent+" has been linked to "+child);
    location.reload(true);
  });
  document.getElementById('addSelectedLink').addEventListener('click', function () {
    let parent = selectedNodes[0].id;
    let child = selectedNodes[1].id;
    if (confirm(parent+" is the parent topic of "+child)) {
      connectNodes(parent,child);
      confirm(parent+" has been linked to "+child);
    } else {
      if (confirm(child+" is the parent topic of "+parent)) {
        connectNodes(child,parent);
        confirm(child+" has been linked to "+parent);
      }
    }
    location.reload(true);
  });
  document.getElementById('remLinkSubmit').addEventListener('click', function (event) {
    event.preventDefault();
    let parent = document.getElementById('remSrcTopic').value
    let child = document.getElementById('remTrgtTopic').value
    unlinkNodes(parent,child);
    unlinkNodes(child, parent);
    confirm(child+" has been unlinked from "+parent);
    location.reload(true);
  });
  document.getElementById('removeSelectedLink').addEventListener('click', function () {
    let parent = selectedNodes[0].id;
    let child = selectedNodes[1].id;
    unlinkNodes(parent, child);
    unlinkNodes(child, parent);
    confirm(parent+" and "+child+" have been unlinked.")
    location.reload(true);
  });
  async function connectNodes(parent, child) {
    fetch('/node/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ parent: parent, child: child})})
        .then(response => response.json())
        .then(data => {
            console.log(data.message); 
        })
    return
  }
  async function unlinkNodes(parent, child) {
    fetch('/node/unlink', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ parent: parent, child: child})})
        .then(response => response.json())
        .then(data => {
            console.log(data.message); 
        })
    return
  }
  let selectedNodesDiv = document.getElementById("selectedNodesDiv");

// Style the selectedNodesDiv
selectedNodesDiv.style.position = 'fixed';  // Make it fixed position
selectedNodesDiv.style.top = '15%';           // Start from the top
selectedNodesDiv.style.right = '1.5%';         // Stick it to the right side
selectedNodesDiv.style.width = '25%';       // Set width to 20% of the screen
selectedNodesDiv.style.zIndex = '-1';     // Ensure it stays on top of other content

  function updateSelectedNodesDisplay() {
    const div = document.getElementById("selectedNodesDiv");
    while (selectedNodesDiv.firstChild) {
      selectedNodesDiv.removeChild(selectedNodesDiv.firstChild);
  }

    if (selectedNodes.length > 0) {
        div.style.display = "block";
        let title = document.createElement('h4');
    title.innerText = 'Selected Nodes';
    selectedNodesDiv.appendChild(title);

    // Create a list
    let nodeList = document.createElement('ul');

    // Loop through selectedNodes and add them to the list
    selectedNodes.forEach(node => {
        let li = document.createElement('li');
        li.innerText = node.id; // assuming nodes are strings, adjust if they're objects
        nodeList.appendChild(li);
    });

    selectedNodesDiv.appendChild(nodeList);
}

     else {
        div.style.display = "none";
    }
}


  
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("cx", function (d) {
      return d.x = Math.max(
        nodeRadiusScale(d.degree),
        Math.min(width - (nodeRadiusScale(d.degree) + 150), d.x)
      );
    })
      .attr("cy", function (d) {
        return d.y = Math.max(
          nodeRadiusScale(d.degree),
          Math.min(height - nodeRadiusScale(d.degree), d.y)
        );
      });

    label
      .attr("x", function (d) { return d.x = Math.max(5, Math.min(width - 5, d.x)); })
      .attr("y", function (d) { return d.y = Math.max(5, Math.min(height - 5, d.y)); });

  });

  var svgNode = svg.node();
  return svgNode;
}


function _drag(d3) {
  return (
    (simulation) => {

      function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }

      function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = d.x;
        d.fy = d.y;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  )
}

// function _color(d3, graph) {
//   const max_degree = d3.max(graph.nodes.map((d) => d.degree));
//   const scale = d3.scaleLinear().domain([0, max_degree]).range([0, 2]);
//   return d => d3.interpolateRainbow(scale(d.degree));
// }

// function _graph(d3) {
//   return (d3.json("/query/data?id=5062COPP6Y"))
// }


function _graph(d3) {
  // Parse the current URL
  const urlParams = new URLSearchParams(window.location.search);
  
  // Get the courseCode from the URL. If it's not present, use a default value.
  const courseCode = urlParams.get('courseCode') || 'NOPE';
  
  return (d3.json(`/query/data?id=${courseCode}`));
}


function _d3(require) {
  return (require("d3@5"))
}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer("chart")).define("chart", ["graph", "d3", "width", "DOM", "_", "drag"], _chart);
  main.variable(observer("drag")).define("drag", ["d3"], _drag);
  // main.variable(observer("color")).define("color", ["d3", "graph"], _color);
  main.variable(observer("graph")).define("graph", ["d3"], _graph);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  return main;
}