// Whenever the window resizes, call the handleResize function
d3.select(window).on("resize", handleResize);

// When the browser loads, loadChart() is called
loadChart();

function handleResize() {
  var svgArea = d3.select("svg");

  // If there is already an svg container on the page, remove it and reload the chart
  if (!svgArea.empty()) {
    svgArea.remove();
    loadChart();
  }
}

function loadChart() {
  // Step 0: Set up our chart
  //= ================================
  var svgMaxWidth = 960;
  var svgMaxHeight = 500;
  // Define SVG area dimensions
  var svgWidth = window.innerWidth;
  var svgHeight = window.innerHeight;

  var margin = { top: 20, right: 40, bottom: 80, left: 100 };

  var width = svgWidth - margin.left - margin.right;
  var height = svgHeight - margin.top - margin.bottom;

  // Create an SVG wrapper, append an SVG group that will hold our chart, and shift the latter by left and top margins.
  var svg = d3
    .select(".chart")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Append an SVG group
  var chart = svg.append("g");

  // Append a div to the body to create tooltips, assign it a class
  d3.select(".chart").append("div").attr("class", "tooltip").style("opacity", 0);

  // Retrieve data from the CSV file and execute everything below
  d3.csv("./data/dataset.csv", function(err, dataset) {
    if (err) throw err;

    dataset.forEach(function(data) {
      data.per_below_poverty = +data.per_below_poverty;
      data.per_no_coverage = +data.per_no_coverage;
      data.median_income = +data.median_income;
      data.per_everyday_smoker = +data.per_everyday_smoker;
      data.median_age = +data.median_age;
      data.per_obsess = +data.per_obsess;
    });
    // Create dataset names from column names
    var columnNames =  (dataset.columns).slice(3);
    const xAxisNames = columnNames.slice(0, columnNames.length / 2);
    const yAxisNames = columnNames.slice(columnNames.length / 2, columnNames.length);
    const columnValues = ["Poverty: ","Median Income: ", "Median Age: " ,"Lacks Coverage: ","Everyday Smokers: ", "Obesity: "];
    const columnUnits = ["%","","","%","%","%"];
    // Create tooltip info string object from column names and values
    const toolTipInfoObj = columnNames.reduce((toolTipInfoObj, value, index) => {
      toolTipInfoObj[value] = columnValues[index];
      return toolTipInfoObj;
      }, {});
    const toolTipUnitObj = columnNames.reduce((toolTipUnitObj, value, index) => {
      toolTipUnitObj[value] = columnUnits[index];
      return toolTipUnitObj;
      }, {});

    // Create scale functions
    var yLinearScale = d3.scaleLinear().range([height, 0]);

    var xLinearScale = d3.scaleLinear().range([0, width]);

    // Create axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // These variables store the minimum and maximum values in a column in data.csv
    var xMin;
    var xMax;
    var yMax;

    // This function identifies the minimum and maximum values in a column in dataset.csv
    // and assign them to xMin and xMax variables, which will define the axis domain
    function findMinAndMax(dataColumnX, dataColumnY) {
      xMin = d3.min(dataset, function(data) {
        return +data[dataColumnX] * 0.8;
      });

      xMax = d3.max(dataset, function(data) {
        return +data[dataColumnX] * 1.1;
      });

      yMin = d3.min(dataset, function(data) {
        return +data[dataColumnY] * 0.8;
      });

      yMax = d3.max(dataset, function(data) {
        return +data[dataColumnY] * 1.1;
      });
    }

    // The default x-axis is 'per_below_poverty'
    // Another axis can be assigned to the variable during an onclick event.
    // This variable is key to the ability to change axis/data column
    var currentAxisLabelX = "per_below_poverty";
    var currentAxisLabelY = "per_no_coverage";

    // Call findMinAndMax() with 'per_below_poverty' as default
    findMinAndMax(currentAxisLabelX, currentAxisLabelY);

    // Set the domain of an axis to extend from the min to the max value of the data column
    xLinearScale.domain([xMin, xMax]);
    yLinearScale.domain([yMin, yMax]);

    // Initialize tooltip
    var toolTip = d3
      .tip()
      .attr("class", "tooltip")
      // Define position
      .offset([80, -60])
      // The html() method allows us to mix JavaScript with HTML in the callback function
      .html(function(data) {
        var stateName = data.state;
        var yAxisInfo = +data[currentAxisLabelY];
        var xAxisInfo = +data[currentAxisLabelX];
        // Tooltip text depends on which axis is active/has been clicked
        var xAxisString = toolTipInfoObj[currentAxisLabelX];
        var yAxisString = toolTipInfoObj[currentAxisLabelY];
        var xAxisUnit = toolTipUnitObj[currentAxisLabelX];
        var yAxisUnit = toolTipUnitObj[currentAxisLabelY];

        return stateName +
          "<br>" +
          xAxisString +
          xAxisInfo + xAxisUnit +
          "<br>" + 
          yAxisString +
          yAxisInfo + yAxisUnit ;
      });

    // Create tooltip
    chart.call(toolTip);
    // Define the data for the circles
    var elem = chart.selectAll("g circleText")
        .data(dataset)
    
    // Create and place the "blocks" containing the circle and the text  
    var elemEnter = elem.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(data, index) {
          return "translate(" + xLinearScale(data[currentAxisLabelX]) + "," + yLinearScale(data[currentAxisLabelY]) + ")" ;});
    
    // Create the circle for each block
    var circle = elemEnter.append("circle")
        .attr("r", "9")
        .attr("fill", "#a3c2c2")
    
    // Create the text for each block
    elemEnter.append("text")
        .attr("class", "circleText")
        .text(function(data) {
          return data.st_abbr;
        })

    elemEnter
      // display tooltip on click
      .on("click", function(data) {
        toolTip.show(data);
      })
      // display tooltip on click
      .on("mouseover", function(data) {
        toolTip.show(data);
      })    
      // hide tooltip on mouseout
      .on("mouseout", function(data, index) {
        toolTip.hide(data);
      })


    // Append an SVG group for the x-axis, then display the x-axis
    chart
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      // The class name assigned here will be used for transition effects
      .attr("class", "x-axis")
      .call(bottomAxis);

    // Append a group for y-axis, then display it
    chart.append("g").call(leftAxis);

    // Append y-axis label
    chart
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 55)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .attr("class", "yaxis-text active")
      .attr("data-axis-name", "per_no_coverage")
      .text("Lacks Health Care (%)");

    //
    chart
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 30)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .attr("class", "yaxis-text inactive")
      .attr("data-axis-name", "per_everyday_smoker")
      .text("Smokers (%)");

    //
    chart
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left + 10)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .attr("class", "yaxis-text inactive")
    .attr("data-axis-name", "per_obsess")
    .text("Obsse (%)");

    // Append x-axis labels
    chart
      .append("text")
      .attr(
        "transform",
        "translate(" + width / 2 + " ," + (height + margin.top + 15) + ")"
      )
      // This axis label is active by default
      .attr("class", "axis-text active")
      .attr("data-axis-name", "per_below_poverty")
      .text("In Poverty (%)");

    chart
      .append("text")
      .attr(
        "transform",
        "translate(" + width / 2 + " ," + (height + margin.top + 35) + ")"
      )
      // This axis label is inactive by default
      .attr("class", "axis-text inactive")
      .attr("data-axis-name", "median_age")
      .text("Age (Median)");

    chart
      .append("text")
      .attr(
        "transform",
        "translate(" + width / 2 + " ," + (height + margin.top + 55) + ")"
      )
      // This axis label is inactive by default
      .attr("class", "axis-text inactive")
      .attr("data-axis-name", "median_income")
      .text("Household Income (Median)");

    // Change an axis's status from inactive to active when clicked (if it was inactive)
    // Change the status of all active axes to inactive otherwise
    function labelChange(clickedAxis, clickedAxisClass) {
      d3
        .selectAll(clickedAxisClass)
        .filter(".active")
        // An alternative to .attr("class", <className>) method. Used to toggle classes.
        .classed("active", false)
        .classed("inactive", true);

      clickedAxis.classed("inactive", false).classed("active", true);
    }

    d3.selectAll(".axis-text, .yaxis-text").on("click", function() {
      // Assign a variable to current axis
      var clickedSelection = d3.select(this);
      // "true" or "false" based on whether the axis is currently selected
      var isClickedSelectionInactive = clickedSelection.classed("inactive");
      // console.log("this axis is inactive", isClickedSelectionInactive)
      // Grab the data-attribute of the axis and assign it to a variable
      // e.g. if data-axis-name is "poverty," var clickedAxis = "poverty"
      var clickedAxis = [clickedSelection.attr("data-axis-name"), "."+clickedSelection.attr("class").split(" ")[0]];
      console.log("current axis: ", clickedAxis);

      // The onclick events below take place only if the x or y-axis is inactive
      // Clicking on an already active axis will therefore do nothing
      if (isClickedSelectionInactive) {
        if (clickedAxis[1] === ".axis-text"){
          xAxisNames.forEach(function(xname) {
            if (xname == clickedAxis[0]){
              // Assign the clicked axis to the variable currentAxisLabelX
              currentAxisLabelX = clickedAxis[0];}
            });
        }
        if (clickedAxis[1] === ".yaxis-text"){
          yAxisNames.forEach(function(yname) {
            // Assign the clicked axis to the variable currentAxisLabelY
            if(yname == clickedAxis[0]){
                currentAxisLabelY = clickedAxis[0];}
            });
        }

        // Call findMinAndMax() to define the min and max domain values.
        findMinAndMax(currentAxisLabelX, currentAxisLabelY);
        // Set the domain for the x-axis and Y-axis
        xLinearScale.domain([xMin, xMax]);
        yLinearScale.domain([yMin, yMax]);
        // Create a transition effect for the x-axis
        svg
          .select(".x-axis")
          .transition()
          // .ease(d3.easeElastic)
          .duration(1800)
          .call(bottomAxis);
        // Select all nodes to create a transition effect, then relocate its horizontal location
        // based on the new axis that was selected/clicked
        d3.selectAll(".node").each(function() {
          d3
            .select(this)
            .transition()
            //.ease(d3.easeBounce)
            .attr("transform", function(data, index) {
              return "translate(" + xLinearScale(data[currentAxisLabelX]) + "," + yLinearScale(data[currentAxisLabelY]) + ")" ;})    
            .duration(1800);
        });

        // Change the status of the axes. See above for more info on this function.
        labelChange(clickedSelection, clickedAxis[1]);
      }
    });
  });
}