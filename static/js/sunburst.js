var width = 700,
    height = 500,
    radius = (Math.min(width, height) / 2) ;

var formatNumber = d3.format(",d");

var x = d3.scale.linear().range([0, 2 * Math.PI]);
var y = d3.scale.sqrt().range([0, radius]);

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
    w: 75, h: 30, s: 3, t: 10
};


// make `colors` an ordinal scale
var colors = d3.scale.category20();

var partition = d3.layout.partition()
.value(function(d) { return d.size; });

var arc = d3.svg.arc()
.startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
.endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
.innerRadius(function(d) { return Math.max(0, y(d.y)); })
.outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });


function buildModel(root) {
    var result = {}
    result.name = root.conformsTo().__name; // name = name of the classifier used for categorising elements => should be configurable.
    result.size = 1; // size of the partition should be computable/configurable.

    result.data = root;

    _.each(root.__jsmf__.references, function(e, n) {
        _.each(e, function(elem) {
            if(result.children == undefined) {
                result.children = [];
            }
            result.children.push(buildModel(elem));
        });
    });
    return result;
}

function buildVisualization(visuJSMF, svg) {
    // Basic setup of page elements.
    initializeBreadcrumbTrail();

    //console.log(visuJSMF.data);

    var nodes = partition.nodes(visuJSMF).filter(function(d) {
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

    //createVisualization(visuJSMF);
    svg.selectAll("path")
    .data(partition.nodes(visuJSMF))
    .enter().append("path")
    .attr("d", arc)
    .style("fill", function(d) {  return colors(d.name); })
    .on("click", click)
    .on("mouseover", mouseover)
    .append("title")
    .text(function(d) { return d.name + "\n" + formatNumber(d.value); });

    // make sure this is done after setting the domain
    drawLegend();



    d3.select(self.frameElement).style("height", height + "px");

}

function getJsmfELementIdentifier(d) {
    var result ="";
    var typeName=d.name;
    
    switch(typeName) {
        case "Component":   result=d.data.name; break;       
        case "Application": result=d.data.name; break;
        case "Instruction": result=d.data.class_name; break;
        case "Attribute":   result=d.data.value; break;
        default:            result="";
    }
    
    if(result==undefined) {
        result = "";
    }
    
    return result;
}


function click(d, i) {
    //console.log(d);

    var chart_id = d3.event.originalTarget.farthestViewportElement.id;

    var component_name = getJsmfELementIdentifier(d);
        
    //retieve the module component in the other view

    transition(chart_id, d);

    d3.selectAll(".sunburst")[0]
    .filter(function(elem) { return elem.id !== chart_id })
    .map(function(sunburst_svg) {
        if(component_name!==""){
            d3.select("#"+sunburst_svg.id).select("svg").select("g").selectAll("path")[0]
            .filter(function(typeElem){return typeElem.__data__.name == d.name})
            .filter(function(itElem){
               var jsmfElment = itElem.__data__.data;
                var test = getJsmfELementIdentifier(itElem.__data__);
                return test==component_name;
            }).map(function(x){
                console.log(getJsmfELementIdentifier(x.__data__));
                transition(sunburst_svg.id, x.__data__);        
            }); 
 
        }
    })
}

function transition(chart_id, d) {
    var svg = d3.select("#"+chart_id);

    //console.log(svg);

    svg.transition()
    .duration(750)
    .tween("scale", function() {
        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
        yd = d3.interpolate(y.domain(), [d.y, 1]),
        yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
        return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
    })
    .selectAll("path")
    .attrTween("d", function(d) { return function() { return arc(d); }; });
}

function mouseover(d, i) {

    var chart_id = d3.event.originalTarget.farthestViewportElement.id;
    var svg = d3.select("#"+chart_id);

    d3.select("#explanation-"+chart_id).style("visibility", "");

    var tTitle = 'Class '+d.name;
    var M2title = d3.select("#titleProperties-"+chart_id).text(tTitle)
    var table = d3.select('#cellsProperties-'+chart_id);
    table.html("");
    var jsmfData = d.data;
    for(index in jsmfData.__jsmf__.attributes) {
        var attType = jsmfData.conformsTo().attributes[index].type;
        var value = jsmf.isJSMFEnum(attType)? attType.getName(jsmfData[index]) : jsmfData[index];
        //console.log('msg',messageNode[x],x, jsmf.isJSMFEnum(messageNode.conformsTo().attributes[x].type)); //messageNode.conformsTo().attributes[x]
        var tRow = table.append("tr");
        tRow.append("td").attr("class","mdl-data-table__cell--non-numeric").text(index);
        tRow.append("td").
        attr("class","mdl-data-table__cell--non-numeric").
        append("input").
        attr("class","mdl-textfield--full-width mdl-textfield__input").
        attr("type","text").
        attr("value",value).
        on("change", function(e) { //Adding event handler on change "value"
            d3.event.stopPropagation();
            //console.log(this.value);
            //update Class + model (or add "flexible attribute")
        });
    }

    var sequenceArray = getAncestors(d);
    updateBreadcrumbs(sequenceArray, d.name);

    d3.selectAll("path")
    .style("opacity", 0.7);

    // Then highlight only those that are an ancestor of the current segment.
    svg.selectAll("path")
    .filter(function(node) {
        return (sequenceArray.indexOf(node) >= 0);
    })
    .style("opacity", 1.5);
}

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
    var path = [];
    var current = node;
    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }
    return path;
}

function initializeBreadcrumbTrail() {
    // Add the svg area.
    var trail = d3.select("#sequence1").append("svg:svg")
    .attr("width", width)
    .attr("height", 50)
    .attr("id", "trail");
    // Add the label at the end, for the percentage.
    trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
    var points = [];
    points.push("0,0");
    points.push(b.w + ",0");
    points.push(b.w + b.t + "," + (b.h / 2));
    points.push(b.w + "," + b.h);
    points.push("0," + b.h);
    if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
        points.push(b.t + "," + (b.h / 2));
    }
    return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

    // Data join; key function combines name and depth (= position in sequence).
    var g = d3.select("#trail")
    .selectAll("g")
    .data(nodeArray, function(d) { return d.name + d.depth; });

    // Add breadcrumb and label for entering nodes.
    var entering = g.enter().append("svg:g");

    entering.append("svg:polygon")
    .attr("points", breadcrumbPoints)
    .style("fill", function(d) { return colors(d.name); });

    entering.append("svg:text")
    .attr("x", (b.w + b.t) / 2)
    .attr("y", b.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(function(d) { return d.name; });

    // Set position for entering and updating nodes.
    g.attr("transform", function(d, i) {
        return "translate(" + i * (b.w + b.s) + ", 0)";
    });

    // Remove exiting nodes.
    g.exit().remove();

    // Now move and update the percentage at the end.
    d3.select("#trail").select("#endlabel")
    .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
    .attr("y", b.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(percentageString);

    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trail")
    .style("visibility", "");

}

function drawLegend() {
    // Dimensions of legend item: width, height, spacing, radius of rounded rect.
    var li = {
        w: 75, h: 30, s: 3, r: 3
    };

    var legend = d3.select("#legend").append("svg:svg")
    .attr("width", li.w)
    .attr("height", colors.domain().length * (li.h + li.s));

    var g = legend.selectAll("g")
    .data(colors.domain())
    .enter().append("svg:g")
    .attr("transform", function(d, i) {
        return "translate(0," + i * (li.h + li.s) + ")";
    });

    g.append("svg:rect")
    .attr("rx", li.r)
    .attr("ry", li.r)
    .attr("width", li.w)
    .attr("height", li.h)
    .style("fill", function(d) { return colors(d); });

    g.append("svg:text")
    .attr("x", li.w / 2)
    .attr("y", li.h / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text(function(d) { return d; });
}
