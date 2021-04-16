
Tree = function(_svg, _data) {
    this.svg = _svg;
    this.data = _data;

    console.log("here: ", this.data);

    this.initVis();
}

Tree.prototype.initVis = function() {
    var vis = this;

    vis.i = 0;
    vis.duration = 750;
    vis.root;
    vis.collapse = false;


    // Tooltip placeholder
    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "Mutations: " + d.data.size;
        });

    vis.svg.attr("style", "outline: 2px dashed black; margin-top: 20px");

    vis.svg.append("rect")
        .attr("width", vis.svg.attr("width"))
        .attr("height", vis.svg.attr("height"))
        .style("fill", "none")
        .style("pointer-events", "all")
        .call(d3.zoom()
            .scaleExtent([1 / 2, 20])
            .on("zoom", zoomed));


    vis.tree = vis.svg.append("g")
        .attr("class", "regular-tree")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



    vis.tree.call(vis.tip);

    // declares a tree layout and assigns the size
    if(checker === false) {
        vis.treemap = d3.tree().size([vis.svg.attr("height"), vis.svg.attr("width")]);
    }else {
        vis.treemap = d3.tree().size([vis.svg.attr("height") * 3, vis.svg.attr("width")]);
        vis.tree.attr("transform", "scale(0.4)")
    }


    function zoomed() {
        vis.tree.attr("transform", d3.event.transform);
    }


    vis.wrangleData();
}

Tree.prototype.wrangleData = function() {
    var vis = this;

    // Assigns parent, children, height, depth
    vis.root = d3.hierarchy(vis.data, function(d) { return d.children; });
    vis.root.x0 = vis.svg.attr("width") / 2;
    vis.root.y0 = 0;

    vis.updateVis();
}

Tree.prototype.updateVis = function() {
    var vis = this;

    d3.select("#collapse").on("change", function(d) {
        // Collapse after the second level
        if(vis.collapse === true) {
            vis.collapse = false;
            expandAll()
            vis.updateVis()
        }else {
            vis.collapse = true;
            vis.root.children.forEach(collapse);
            vis.updateVis();
        }
    });

    update(vis.root);

    // Collapse the node and all it's children
    function collapse(d) {
        if(d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expand(d){
        var children = (d.children)?d.children:d._children;
        if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        if(children)
            children.forEach(expand);
    }

    function expandAll(){
        expand(vis.root);
        update(vis.root);
    }

    function update(source) {

        // Assigns the x and y position for the nodes
        var treeData = vis.treemap(vis.root);

        // Compute the new tree layout.
        var nodes = treeData.descendants();
        var links = treeData.descendants().slice(1);

        // Normalize for fixed-depth.
        nodes.forEach(function(d){ d.y = d.depth * 180});

        // ****************** Nodes section ***************************

        // Update the nodes...
        var node = vis.tree.selectAll('g.node')
            .data(nodes, function(d) {
                return d.id || (d.id = ++(vis.i));
            });

        // Enter any new modes at the parent's previous position.
        var nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', click);

        // Add Circle for the nodes
        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            })
            .on('mouseover', vis.tip.show)
            .on('mouseout', vis.tip.hide);

        // Add labels for the nodes
        nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("x", function(d) {
                return d.children || d._children ? -13 : 13;
            })
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) { return d.data.shortName; });

        // UPDATE
        var nodeUpdate = nodeEnter.merge(node);

        // Transition to the proper position for the node
        nodeUpdate.transition()
            .duration(vis.duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Update the node attributes and style
        nodeUpdate.select('circle.node')
            .attr('r', 10)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            })
            .attr('cursor', 'pointer');


        // Remove any exiting nodes
        var nodeExit = node.exit().transition()
            .duration(vis.duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        // On exit reduce the node circles size to 0
        nodeExit.select('circle')
            .attr('r', 1e-6);

        // On exit reduce the opacity of text labels
        nodeExit.select('text')
            .style('fill-opacity', 1e-6);

        // ****************** links section ***************************

        // Update the links...
        var link = vis.tree.selectAll('path.link')
            .data(links, function(d) { return d.id; });

        // Enter any new links at the parent's previous position.
        var linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', function(d){
                var o = {x: source.x0, y: source.y0}
                return diagonal(o, o)
            });

        // UPDATE
        var linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate.transition()
            .duration(vis.duration)
            .attr('d', function(d){ return diagonal(d, d.parent) });

        // Remove any exiting links
        var linkExit = link.exit().transition()
            .duration(vis.duration)
            .attr('d', function(d) {
                var o = {x: source.x, y: source.y}
                return diagonal(o, o)
            })
            .remove();

        // Store the old positions for transition.
        nodes.forEach(function(d){
            d.x0 = d.x;
            d.y0 = d.y;
        });

        // Creates a curved (diagonal) path from parent to the child nodes
        function diagonal(s, d) {

            path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

            return path
        }

        // Toggle children on click.
        function click(d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        }
    }

}













