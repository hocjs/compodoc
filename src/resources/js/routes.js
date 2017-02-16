function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var m = [
        20, 120, 20, 120
    ],
    w = 1280 - m[1] - m[3],
    h = 800 - m[0] - m[2],
    i = 0,
    root;

var tree = d3.layout.tree().size([h, w]);

var diagonal = d3.svg.diagonal().projection(function(d) {
    return [d.y, d.x];
});

var vis = d3.select("#body-routes").append("svg:svg").attr("width", w + m[1] + m[3]).attr("height", h + m[0] + m[2]).append("svg:g").attr("transform", "translate(" + m[3] + "," + m[0] + ")");

d3.json("routes/routes.json", function(json) {
    root = json;
    root.x0 = 0;
    root.y0 = 0;

    update(root);
});

function update(source) {
    var duration = 750;

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse();

    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
        d.y = d.depth * 180;
    });

    nodes[nodes.length - 1].x = 38;

    // Update the nodes…
    var node = vis.selectAll("g.node").data(nodes, function(d) {
        return d.id || (d.id = ++i);
    });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g").attr("class", "node").attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
    }).on("click", function(d) {
        toggle(d);
        update(d);
    });

    // Node icon
    nodeEnter.append('svg:text')
    .attr("y", function(d) {
        return 5;
    })
    .attr("x", function(d) {
        return 0;
    })
    .attr('font-family', 'FontAwesome')
    .attr('class', function(d) {
        return d.children || d._children
            ? "icon has-children"
            : "icon";
    })
    .attr('font-size', function(d) {
        return '15px'
    }).text(function(d) {
        return '\uf126'
    });

    //
    // Node description
    //
    nodeEnter.append("svg:text")
    .attr("x", function(d) {
        return 0;
    })
    .attr("y", function(d) {
        return 10;
    })
    .attr("dy", ".35em")
    .attr('class', 'text')
    .attr("text-anchor", function(d) {
        return "start";
    }).html(function(d) {
        let _name = '<tspan x="0" dy="1.4em">' + htmlEntities(d.name) + '</tspan>',
            url = (d.kind === 'module') ? `./modules/${d.className}.html` : `./components/${d.className}.html`,
            link = `<a href="${url}">${d.className}</a>`;
        if (d.className) {
            _name += '<tspan x="0" dy="1.4em">' + link + '</tspan>';
        }
        return _name;
    }).style("fill-opacity", 1e-6)
    .call(getBB);
    //
    // Node description background
    //
    nodeEnter.insert("rect","text")
    .attr("width", function(d){return d.bbox.width})
    .attr("height", function(d){return d.bbox.height})
    .attr("y", function(d) {
        return 15;
    })
    .style("fill", "white")
    .style("fill-opacity", 0.75);
    function getBB(selection) {
        selection.each(function(d){d.bbox = this.getBBox();})
    }

    //
    // Node lazy loaded ?
    //
    nodeEnter.append('svg:text')
    .attr("y", function(d) {
        return 27;
    })
    .attr("x", function(d) {
        return -18;
    })
    .attr('font-family', 'FontAwesome')
    .attr('class', function(d) {
        return "icon";
    })
    .attr('font-size', function(d) {
        return '15px'
    }).text(function(d) {
        var _text = '';
        if (d.lazy) {
            _text = '\uf017';
        }
        if (d.guarded) {
            _text = '\uf023';
        }
        return _text;
    });

    // Transition nodes to their new position.
    var nodeUpdate = node.transition().duration(duration).attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
    });

    nodeUpdate.select("circle").attr("r", 4.5).style("fill", function(d) {
        return d._children
            ? "lightsteelblue"
            : "#fff";
    });

    nodeUpdate.selectAll("text").style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition().duration(duration).attr("transform", function(d) {
        return "translate(" + source.y + "," + source.x + ")";
    }).remove();

    nodeExit.select("circle").attr("r", 1e-6);
    nodeExit.select("text").style("fill-opacity", 1e-6);

    // Update the links…
    var link = vis.selectAll("path.link").data(tree.links(nodes), function(d) {
        return d.target.id;
    });

    // Enter any new links at the parent's previous position.
    link.enter().insert("svg:path", "g").attr("class", "link").attr("d", function(d) {
        var o = {
            x: source.x0,
            y: source.y0
        };
        return diagonal({source: o, target: o});
    }).transition().duration(duration).attr("d", diagonal);

    // Transition links to their new position.
    link.transition().duration(duration).attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition().duration(duration).attr("d", function(d) {
        var o = {
            x: source.x,
            y: source.y
        };
        return diagonal({source: o, target: o});
    }).remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Toggle children.
function toggle(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
}