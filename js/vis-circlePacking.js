CirclePacking = function(_svg, _data) {
    this.svg = _svg;
    this.data = _data;
    this.displayData = _data;

    console.log("Data: ", this.data);

    this.initVis();
}

CirclePacking.prototype.initVis = function() {
    var vis = this;

    vis.diameter = parseInt(vis.svg.attr("height"));

    vis.tree = vis.svg.append("g")
        .attr("transform", "translate(" + vis.svg.attr("width") / 2 + "," + vis.diameter / 2 + ")");

    vis.margin = 20;

    vis.color = d3.scaleLinear()
        .domain([-1, 5])
        .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl);

    vis.pack = d3.pack()
        .size([vis.diameter - vis.margin, vis.diameter - vis.margin])
        .padding(2);

    vis.view;

    vis.wrangleData();
}

CirclePacking.prototype.wrangleData = function() {
    var vis = this;

    vis.root = d3.hierarchy(vis.data)
        .sum(function(d) { return d.size; })
        .sort(function(a, b) {return b.value - a.value; });

    vis.focus = vis.root;
    vis.nodes = vis.pack(vis.root).descendants();

    vis.updateVis();
}

CirclePacking.prototype.updateVis = function() {
    var vis = this;

    vis.circle = vis.tree.selectAll("circle")
        .data(vis.nodes)
        .enter()
        .append("circle")
        .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
        .style("fill", function(d) { return d.children ? vis.color(d.depth) : null; })
        .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

    vis.text = vis.tree.selectAll("text")
        .data(vis.nodes)
        .enter()
        .append("text")
        .attr("class", "label")
        .style("fill-opacity", function(d) { return d.parent === vis.root ? 1 : 0; })
        .style("display", function(d) { return d.parent === vis.root ? "inline" : "none"; })
        .text(function(d) { return d.data.shortName; });

    vis.node = vis.tree.selectAll("circle,text");

    vis.tree.style("background", vis.color(-1))
        .on("click", function() { zoom(vis.root); });

    zoomTo([vis.root.x, vis.root.y, vis.root.r * 2 + vis.margin]);

    function zoom(d) {
        var focus0 = focus; focus = d;

        var transition = d3.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", function(d) {
                var i = d3.interpolateZoom(vis.view, [focus.x, focus.y, focus.r * 2 + vis.margin]);
                return function(t) { zoomTo(i(t)); };
            });

        transition.selectAll("text")
            .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
            .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
            .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
    }

    function zoomTo(v) {
        var k = vis.diameter / v[2]; vis.view = v;
        vis.node.attr("transform", function(d) {
            return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
        });
        vis.circle.attr("r", function(d) {
            return d.r * k; });
    }

}