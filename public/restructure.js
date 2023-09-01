// function _chart(graph, d3, width, DOM, _, color, drag) {
// 	let selectedNodes = []; //For Precessing Selected Nodes

// 	const radiusExtent = [5, 18],
// 				linkExtent = [1, 10],
// 				height = (graph.nodes.length < 800 ? 1000 : graph.nodes.length * 12);

// 	const simulation = d3.forceSimulation(graph.nodes)
// 		.force("link", d3.forceLink(graph.links).id(d => d.id))
// 		.force("charge", d3.forceManyBody().strength(-60))
// 		.force("center", d3.forceCenter(width / 2, height / 2))
// 		.force("collide", d3.forceCollide().radius(function (d) { return 50; }).strength(.5).iterations(1));

// 	const svg = d3.select(DOM.svg(width, height));
//   svg.selectAll("*").remove();
//   defineSVGFilters(svg);

// 	function defineSVGFilters(svg) {
//     svg.append("defs")
//       .append("filter")
//       .attr("id", "redGlow")
//       .append("feGaussianBlur")
//       .attr("stdDeviation", 2.5)
//       .attr("result", "coloredBlur");

//     const feMerge = svg.select("#redGlow")
//       .append("feMerge");

//     feMerge.append("feMergeNode").attr("in", "coloredBlur");
//     feMerge.append("feMergeNode").attr("in", "SourceGraphic");
//   }
	// }