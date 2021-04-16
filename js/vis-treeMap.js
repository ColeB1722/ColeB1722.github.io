
TreeMap = function(_svg, _data) {
    this.svg = _svg;
    this.data = _data;

    console.log("Data: ", this.data);

    this.initVis();
}

TreeMap.prototype.initVis = function() {
    var vis = this;

    vis.formatNumber = d3.format(",");
    vis.transitioning;

    vis.x = d3.scaleLinear()
        .domain([0, vis.svg.attr("width")])
        .range([0, vis.svg.attr("width")]);
    vis.y = d3.scaleLinear()
        .domain([0, vis.svg.attr("height")])
        .range([0, vis.svg.attr("height")]);

    vis.treemap = d3.treemap()
        .size([vis.svg.attr("width"), vis.svg.attr("height")])
        .paddingInner(0)
        .round(false);

    vis.tree = vis.svg
        .style("margin-left", -margin.left + "px")
        .style("margin.right", -margin.right + "px")
        .append("g")
        .attr("class", "regular-tree")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("shape-rendering", "crispEdges");

    vis.grandparent = vis.tree.append("g")
        .attr("class", "grandparent");
    vis.grandparent.append("rect")
        .attr("y", -margin.top)
        .attr("width", vis.svg.attr("width"))
        .attr("height", margin.top)
        .attr("fill", '#bbbbbb');
    vis.grandparent.append("text")
        .attr("x", 6)
        .attr("y", 6 - margin.top)
        .attr("dy", ".75em");

    vis.wrangleData();
}

TreeMap.prototype.wrangleData = function() {
    var vis = this;

    console.log("this happens");

    vis.root = d3.hierarchy(vis.data);

    vis.treemap(vis.root
        .sum(function (d) {
            return d.size;
        })
        .sort(function (a, b) {
            return b.height - a.height || b.size - a.size
        }));

    vis.updateVis();
}

TreeMap.prototype.updateVis = function() {
    var vis = this;

    display(vis.root);

    function display(d) {
        // write text into grandparent
        // and activate click's handler
        vis.grandparent
            .datum(d.parent)
            .on("click", transition)
            .select("text")
            .text(name(d));
        // grandparent color
        vis.grandparent
            .datum(d.parent)
            .select("rect")
            .attr("fill", function () {
                return '#bbbbbb'
            });
        var g1 = vis.tree.insert("g", ".grandparent")
            .datum(d)
            .attr("class", "depth");
        var g = g1.selectAll("g")
            .data(d.children)
            .enter().
            append("g");
        // add class and click handler to all g's with children
        g.filter(function (d) {
            return d.children;
        })
            .classed("children", true)
            .on("click", transition);
        g.selectAll(".child")
            .data(function (d) {
                return d.children || [d];
            })
            .enter().append("rect")
            .attr("class", "child")
            .call(rect);
        // add title to parents
        g.append("rect")
            .attr("class", "parent")
            .call(rect)
            .append("title")
            .text(function (d){
                return d.data.shortName;
            });
        /* Adding a foreign object instead of a text object, allows for text wrapping */
        g.append("foreignObject")
            .call(rect)
            .attr("class", "foreignobj")
            .append("xhtml:div")
            .attr("dy", ".75em")
            .html(function (d) {
                console.log(d);
                return '' +
                    '<p class="title"> ' + d.data.shortName + '</p>' +
                    '<p>' + "Mutations: " + d.data.mutation + '</p>'
                    ;
            })
            .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS
        function transition(d) {
            if (vis.transitioning || !d) return;
            vis.transitioning = true;
            var g2 = display(d),
                t1 = g1.transition().duration(650),
                t2 = g2.transition().duration(650);
            // Update the domain only after entering new elements.
            vis.x.domain([d.x0, d.x1]);
            vis.y.domain([d.y0, d.y1]);
            // Enable anti-aliasing during the transition.
            vis.tree.style("shape-rendering", null);
            // Draw child nodes on top of parent nodes.
            vis.svg.selectAll(".depth").sort(function (a, b) {
                return a.depth - b.depth;
            });
            // Fade-in entering text.
            g2.selectAll("text").style("fill-opacity", 0);
            g2.selectAll("foreignObject div").style("display", "none");
            /*added*/
            // Transition to the new view.
            t1.selectAll("text").call(text).style("fill-opacity", 0);
            t2.selectAll("text").call(text).style("fill-opacity", 1);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);
            /* Foreign object */
            t1.selectAll(".textdiv").style("display", "none");
            /* added */
            t1.selectAll(".foreignobj").call(foreign);
            /* added */
            t2.selectAll(".textdiv").style("display", "block");
            /* added */
            t2.selectAll(".foreignobj").call(foreign);
            /* added */
            // Remove the old node when the transition is finished.
            t1.on("end.remove", function(){
                this.remove();
                vis.transitioning = false;
            });
        }
        return g;
    }

    function text(text) {
        text.attr("x", function (d) {
            return vis.x(d.x) + 6;
        })
            .attr("y", function (d) {
                return vis.y(d.y) + 6;
            });
    }

    function rect(rect) {
        rect
            .attr("x", function (d) {
                return vis.x(d.x0);
            })
            .attr("y", function (d) {
                return vis.y(d.y0);
            })
            .attr("width", function (d) {
                return vis.x(d.x1) - vis.x(d.x0);
            })
            .attr("height", function (d) {
                return vis.y(d.y1) - vis.y(d.y0);
            })
            .attr("fill", function (d) {
                return '#bbbbbb';
            });
    }

    function foreign(foreign) { /* added */
        foreign
            .attr("x", function (d) {
                return vis.x(d.x0);
            })
            .attr("y", function (d) {
                return vis.y(d.y0);
            })
            .attr("width", function (d) {
                return vis.x(d.x1) - vis.x(d.x0);
            })
            .attr("height", function (d) {
                return vis.y(d.y1) - vis.y(d.y0);
            });
    }

    function name(d) {
        return breadcrumbs(d) +
            (d.parent
                ? " -  Click to zoom out"
                : " - Click inside square to zoom in");
    }

    function breadcrumbs(d) {
        var res = "";
        var sep = " > ";
        d.ancestors().reverse().forEach(function(i){
            res += i.data.shortName + sep;
        });
        return res
            .split(sep)
            .filter(function(i){
                return i!== "";
            })
            .join(sep);
    }
}
















