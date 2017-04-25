/*************************************************************
Old functions

*/
/*
// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {

// Basic setup of page elements.
initializeBreadcrumbTrail();

d3.select("#togglelegend").on("click", toggleLegend);

// Bounding circle underneath the sunburst, to make it easier to detect
// when the mouse leaves the parent g.
vis.append("svg:circle")
.attr("r", radius)
.style("opacity", 0);

// For efficiency, filter nodes to keep only those large enough to see.
var nodes = partition.nodes(json)
.filter(function(d) {
return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
});

var uniqueNames = (function(a) {
var output = [];
a.forEach(function(d) {
if (output.indexOf(d.name) === -1) {
output.push(d.name);
}
});
return output;
})(nodes);

// set domain of colors scale based on data
colors.domain(uniqueNames);

// make sure this is done after setting the domain
drawLegend();

var path = vis.data([json]).selectAll("path")
.data(nodes)
.enter()
.append("svg:path")
.attr("display", function(d) { return d.depth ? null : "none"; })
.attr("d", arc)
.attr("fill-rule", "evenodd")
.style("fill", function(d) { return colors(d.name); })
.style("opacity", 1)
// .on("mouseover", mouseover)
.on("click", click);

// Add the mouseleave handler to the bounding circle.
d3.select("#container").on("mouseleave", mouseleave);

// Get total size of the tree = value of root node from partition.
totalSize = path.node().__data__.value;
};
