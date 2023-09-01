// Load the data using d3.json
d3.json("./Users/sam/Documents/VU/Thesis/Code/public/data.json").then(function(graph) {
  
    const radiusExtent = [5, 18],
      linkExtent = [1, 10],
      width = 960,
      height = (graph.nodes.length < 40 ? 400 : graph.nodes.length * 12);
  
    const simulation = d3.forceSimulation(graph.nodes)
      .force("link", d3.forceLink(graph.links).id(d => d.id))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(function (d) { return 50; }).strength(.5).iterations(1));
  
    const svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);
  
    var linkStrokeScale = d3.scaleLinear().domain(d3.extent(graph.links, d => d.weight)).range(linkExtent);
  
    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graph.links)
      .join("line")
      .attr("stroke-width", d => linkStrokeScale(+d.weight));
  
    var nodeRadiusScale = d3.scaleLinear().domain(d3.extent(graph.nodes, d => d.degree)).range(radiusExtent);
  
    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(graph.nodes)
      .join("circle")
      .attr("r", d => nodeRadiusScale(+d.degree))
      .attr("fill", d => d3.interpolateRainbow(nodeRadiusScale(+d.degree)))
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("mouseover", function (d) {
        console.log(nodeNeighbors);
        node.filter(nd => !nodeNeighbors[d.id].includes(nd.id)).style("opacity", 0.1);
        link.filter(lkd => !((lkd.source.id == d.id) || (lkd.target.id == d.id))).style("opacity", 0.1);
      })
      .on("mouseout", function (d) {
        node.style("opacity", null);
        link.style("opacity", null);
      })
  
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
      d.fx = null;
      d.fy = null;
    }
  
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
  
      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });
  
  }).catch(function(error){
    console.log(error);
  });
  