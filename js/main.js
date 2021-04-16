
//gueue
queue()
    .defer(d3.csv, "data/PhyloTreeBuild17.csv")
    .defer(d3.json, "data/flare-2.json")
    .await(loadData);

//global variables
var fullList;
var abbrev;
var checker = false;
var index = 1;

//visualization variables
var tree;
var circle;
var map;

//svg
var margin = {top: 30, right: 90, bottom: 30, left: 90},
    width = 1200 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var treeSvg = d3.select("#tree").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);

var treeMapSvg = d3.select("#map").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom);

var circleSvg = d3.select("#circle").append("svg")
    .attr("width", 700 + margin.right + margin.left)
    .attr("height", 700 + margin.top + margin.bottom);

//abbreviated tree
var collapsedTree = [
    {"name": "L0", "region": "Africa", "children": []},
    {"name": "L1", "region": "Africa", "children": []},
    {"name": "L5", "region": "Africa", "children": []},
    {"name": "L2", "region": "Africa", "children": []},
    {"name": "L6", "region": "Africa", "children": []},
    {"name": "L4", "region": "Africa", "children": []},
    {"name": "L3", "region": null, "children": [
            {"name": "L3a", "region": "Africa", "children": []},
            {"name": "L3b'f", "region": "Africa", "children": []},
            {"name": "L3c'd", "region": "Africa", "children": []},
            {"name": "L3e'i'k'x", "region": "Africa", "children": []},
            {"name": "L3h", "region": "Africa", "children": []},
            {"name": "M", "region": null, "children": [
                    {"name": "Q", "region": "Oceania", "children": []},
                    {"name": "M7", "region": "Australia", "children": []},
                    {"name": "M8", "region": "Asia", "children": []},
                    {"name": "M9", "region": "Asia", "children": []},
                    {"name": "G", "region": "Asia", "children": []},
                    {"name": "D", "region": "Asia", "children": []}
                ]},
            {"name": "N", "region": null, "children": [
                    {"name": "O", "region": "Oceania", "children": []},
                    {"name": "S", "region": "Australia", "children": []},
                    {"name": "N1", "region": "Europe", "children": []},
                    {"name": "N2", "region": "Europe", "children": []},
                    {"name": "N9", "region": "Asia", "children": []},
                    {"name": "A", "region": "Asia", "children": []},
                    {"name": "X", "region": "Europe", "children": []},
                    {"name": "R", "region": null, "children": [
                            {"name": "P", "region": "Oceania", "children": []},
                            {"name": "R0", "region": "Europe", "children": []},
                            {"name": "JT", "region": "Europe", "children": []},
                            {"name": "F", "region": "Asia", "children": []},
                            {"name": "R11'B6", "region": "Asia", "children": []},
                            {"name": "U", "region": "Europe", "children": []},
                        ]}
                ]}
        ]}
];

var continents = {
    "shortName": "World",
    "size": null,
    "children": [
        {
            "shortName": "Americas",
            "size": null,
            "children": []
        },
        {
            "shortName": "Africa",
            "size": null,
            "children": []
        },
        {
            "shortName": "Australia",
            "size": null,
            "children": []
        },
        {
            "shortName": "Oceania",
            "size": null,
            "children": []
        },
        {
            "shortName": "Europe",
            "size": null,
            "children": []
        },
        {
            "shortName": "Antarctica",
            "size": null,
            "children": []
        },
        {
            "shortName": "Asia",
            "size": null,
            "children": []
        },
    ]};

d3.select("#comp").on("change", function() {
    checker = !checker;
    updateVisualization();
});
d3.select("#comp2").on("change", function() {
    checker = !checker;
    updateVisualization();
});

//load data
function loadData(error, data1, data2) {
    if (error) throw error;

    //set everything to integers
    var allData = data1.map(function(d) {
        d.parent = parseInt(d.parent);
        d.child = parseInt(d.child);
        d.mutations = parseInt(d.mutations);
        return d;
    });

    //convert to "json"
    fullList = {"name": "matrilineal most recent common ancestor", "shortName": "mt-MRCA",
               "mutation": "", "parent": 1, "size": null, "region": null, "children": []};

    //convert to "json"
    abbrev = {"name": "matrilineal most recent common ancestor", "shortName": "mt-MRCA",
        "mutation": "", "parent": 1, "size": null, "region": null, "children": []};

    //create the full phylogenic tree
    find(fullList, allData);

    find(abbrev, allData);

    determine(collapsedTree, abbrev);

    concat(continents, abbrev);

    //create vis
    createVis();
}

function createVis() {

    //create vis
    tree = new Tree(treeSvg, abbrev);

    circle = new CirclePacking(circleSvg, continents);

    map = new TreeMap(treeMapSvg, continents);

}

function updateVisualization() {

    //remove previous visualization
    d3.select(".regular-tree").remove();

    if(checker) {
        map = new TreeMap(treeMapSvg, fullList);
        tree = new Tree(treeSvg, fullList);
    } else {
        map = new TreeMap(treeMapSvg, continents);
        tree = new Tree(treeSvg, abbrev);
    }

}

//create a tree based off specific haplogroups
function find(parent, child) {
    for(var i = 0; i < child.length; i++) {
        if(parent.parent === child[i].child) {
            var added = {"name": child[i].haplogroup, "shortName": child[i].haplogroup.split(" / ")[0], "mutation":
                    child[i].haplogroup.split(" / ")[1], "parent": child[i].parent , "size": null, "region": "", "children": []};
            parent.children.push(added);
            find(added, child);
        } else {
            parent.size = 1;
        }
    }
    return parent;
}

//find a specific haplogroup based on its name
function iteration(parent, name) {
    if(parent.shortName === name) {
        return parent;
    }
    for(var i = 0; i < parent.children.length; i++) {
        if(parent.children.length !== 0){
            var found = iteration(parent.children[i], name);
            if(found) { return found; }
        }
    }
    return null;
}

//count the number of ancestors following
function count(parent, haploid) {

    if(iteration(parent, haploid.name) === null) {
        if(parent.children.length === 0) {
            return 1;
        } else {
            var amount = parent.children.length;
            for(var i = 0; i < parent.children.length; i++) {
                amount = amount + count(parent.children[i], haploid);
            }
            return amount;
        }
    } else {
        parent = iteration(parent, haploid.name);

        // console.log(haploid.name, " ", haploid.children);

        if(haploid.children.length !== 0) {
            var newchildren = [];

            haploid.children.forEach(function(d) {
                var par = iteration(parent, d.name);
                newchildren.push(par);
            });

            parent.children = newchildren;
            parent.region = haploid.region;

            for(var j = 0; j < haploid.children.length; j++) {
                count(parent, haploid.children[j]);
            }
        } else {
            var total = parent.children.length;
            for(var c = 0; c < parent.children.length; c++) {
                total = total + count(parent.children[c], haploid);
            }
            // console.log(parent.shortName, " ", total)
            parent.children = [];
            parent.size = total;
            parent.region = haploid.region;
        }
    }
}

//create vis based on given array
function determine(arr, obj) {
    for(var i = 0; i < arr.length; i++) {
        count(obj, arr[i])
    }
}

function concat(major, minor) {
    if(minor.region === null || minor.region === "") {
        for(var i = 0; i < minor.children.length; i++) {
            concat(major, minor.children[i]);
        }
    } else {
        if(major.shortName === minor.region) {
            major.children.push(minor);
        }else {
            for(var j = 0; j < major.children.length; j++) {
                concat(major.children[j], minor)
            }
        }
    }
}