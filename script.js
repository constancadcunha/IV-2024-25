// Set up dimensions and margins
const margin = { top: 20, right: 30, bottom: 35, left: 60 };
const width = 800 - margin.left - margin.right;
const scatterWidth = 1800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const scatterHeight = 500 - margin.top - margin.bottom;
const radiusInnerRadius = 60;
const radiusOuterRadius = Math.min(width, height) / 2 - 50;

// Helper function to format numbers
function formatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  } else {
    return num.toFixed(0);
  }
}

// Load all datasets for the scatter plot
Promise.all([
  d3.csv("/data/MentalDisorder_Age.csv"),
  d3.csv("/data/gdp_ppp_per_capita.csv"),
  d3.csv("/data/country_population.csv"),
]).then(([mentalData, gdpData, populationData]) => {
  // Default selections
  let selectedIssue = "Schizophrenia";
  let gdpLimit = 90000;
  let selectedYear = 2014;

  // Process GDP and population data
  const gdpByCountryYear = {};
  const populationByCountryYear = {};

  gdpData.forEach((d) => {
    gdpByCountryYear[d["Country Name"]] =
      gdpByCountryYear[d["Country Name"]] || {};
    for (let year = 2002; year <= 2014; year++) {
      gdpByCountryYear[d["Country Name"]][year] = +d[year];
    }
  });

  populationData.forEach((d) => {
    populationByCountryYear[d["Country Name"]] =
      populationByCountryYear[d["Country Name"]] || {};
    for (let year = 2002; year <= 2014; year++) {
      populationByCountryYear[d["Country Name"]][year] = +d[year];
    }
  });

  // Set up Mental Health compared with GDP scatter plot
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", scatterWidth + margin.left + margin.right)
    .attr("height", scatterHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Define scales
  const xScale = d3.scaleLinear().range([0, scatterWidth]);
  const yScale = d3.scaleLinear().range([scatterHeight, 0]);
  const flagScale = d3.scaleSqrt().range([25, 90]);

  // Axes and labels
  const xAxis = svg.append("g").attr("transform", `translate(0,${scatterHeight})`);
  const yAxis = svg.append("g");

  svg
    .append("text")
    .attr("id", "x-axis-label")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("x", scatterWidth / 2)
    .attr("y", scatterHeight + margin.bottom - 5)
    .text("GDP per Capita");

  const yAxisLabel = svg
    .append("text")
    .attr("class", "axis-label")
    .attr("id", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -scatterHeight / 2)
    .attr("y", -margin.left + 10)
    .text(selectedIssue);

  // Function to update the scatter plot
  function updatePlot() {
    const mergedData = mentalData.map((d) => {
      return {
        country: d.Country,
        code: d.Code,
        gdp: gdpByCountryYear[d.Country]
          ? gdpByCountryYear[d.Country][selectedYear]
          : null,
        population: populationByCountryYear[d.Country]
          ? populationByCountryYear[d.Country][selectedYear]
          : null,
        value: +d[selectedIssue],
      };
    });

    const filteredData = mergedData.filter(
      (d) => d.gdp && d.gdp <= gdpLimit && d.population && d.value
    );

    const uniqueData = Array.from(
      new Set(filteredData.map((d) => d.country))
    ).map((country) => filteredData.find((d) => d.country === country));

    // Update scales
    xScale.domain([0, gdpLimit]);
    yScale.domain([0, d3.max(uniqueData, (d) => d.value) || 0]);
    flagScale.domain([
      d3.min(uniqueData, (d) => d.population),
      d3.max(uniqueData, (d) => d.population),
    ]);

    // Update axes
    xAxis.transition().duration(1000).call(d3.axisBottom(xScale));
    yAxis.transition().duration(1000).call(d3.axisLeft(yScale));
    yAxisLabel.text(selectedIssue);

    // Bind data
    const flags = svg.selectAll("image").data(uniqueData, (d) => d.country);

    // Enter new flags
    flags
      .enter()
      .append("image")
      .attr("xlink:href", (d) => `https://flagsapi.com/${d.code}/shiny/64.png`)
      .attr("width", (d) => flagScale(d.population))
      .attr("height", (d) => (flagScale(d.population) * 2) / 3)
      .attr("x", (d) => xScale(d.gdp) - flagScale(d.population) / 2)
      .attr("y", (d) => yScale(d.value) - (flagScale(d.population) * 2) / 3 / 2)
      .style("opacity", (d) => (d.gdp <= gdpLimit ? 1 : 0))
      .transition()
      .duration(1000)
      .style("opacity", 1);

    // Update existing flags
    flags
      .transition()
      .duration(1000)
      .attr("x", (d) => xScale(d.gdp) - flagScale(d.population) / 2)
      .attr("y", (d) => yScale(d.value) - (flagScale(d.population) * 2) / 3 / 2)
      .attr("width", (d) => flagScale(d.population))
      .attr("height", (d) => (flagScale(d.population) * 2) / 3)
      .style("opacity", (d) => (d.gdp <= gdpLimit ? 1 : 0));

    // Remove old flags
    flags
      .exit()
      .transition()
      .duration(1000)
      .style("opacity", 0)
      .attr("x", width + 100)
      .remove();

    // Tooltip event handlers
    svg
      .selectAll("image")
      .on("mouseover", (event, d) => {
        const mentallyIllCount = Math.round((d.value / 100) * d.population);

        const formattedPopulation = formatNumber(d.population);
        const formattedMentallyIll = formatNumber(mentallyIllCount);
        const formattedGDP = formatNumber(d.gdp);

        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `<strong>${d.country}</strong><br>
          GDP per capita: $${formattedGDP}<br>
          Country population: ${formattedPopulation}<br>
          People with ${selectedIssue}: ${formattedMentallyIll} (${d.value.toFixed(
              2
            )}%)`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });
  }

  // Calculate dynamic GDP limits based on the data
  function updateGDPLimits() {
    const minGDP = d3.min(
      Object.values(gdpByCountryYear).flatMap((d) => Object.values(d))
    );
    const maxGDP = 90000; // Set initial max GDP to 90,000

    gdpLimit = maxGDP; // Set initial GDP limit to the max value

    // Dynamically set the slider attributes based on data
    d3.select("#gdpSlider")
      .attr("min", minGDP)
      .attr("max", maxGDP)
      .attr("step", (maxGDP - minGDP) / 100)
      .attr("value", maxGDP)
      .on("input", function () {
        gdpLimit = +this.value;
        d3.select("#gdpValue").text(`Max GDP: ${formatNumber(gdpLimit)}`);
        updatePlot();
      });

    // Initial GDP value display
    d3.select("#gdpValue").text(`Max GDP: ${formatNumber(maxGDP)}`);
  }

  // Event listener for dropdown (mental issue)
  d3.select("#issueSelect").on("change", function () {
    selectedIssue = this.value;
    updatePlot();
  });

  // Event listener for year slider
  d3.select("#year-slider").on("input", function () {
    selectedYear = +this.value;
    d3.select("#year-value").text(`${selectedYear}`);
    updatePlot();
  });

  // Initial setup
  updateGDPLimits();
  updatePlot();
});

// End of the Mental Health compared with GDP scatter plot

// Create the SVG element for the histogram
const svg = d3
  .select("#histogram")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Create scales for x (GDP per capita) and y (Alcohol Consumption)
const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);
const color = d3.scaleSequential(d3.interpolateYlOrRd);

// Create axes
const xAxis = svg.append("g").attr("transform", `translate(0,${height})`);
const yAxis = svg.append("g");

// Add x-axis label
svg
  .append("text")
  .attr("class", "axis-label")
  .attr("text-anchor", "middle")
  .attr("x", width / 2)
  .attr("y", height + margin.bottom - 5)
  .text("GDP per capita (PPP)");

// Add y-axis label
svg
  .append("text")
  .attr("class", "axis-label")
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .attr("y", -margin.left + 20)
  .attr("x", -height / 2)
  .text("Alcohol Consumption (liters per capita)");

// Select the existing tooltip div
const tooltip = d3.select("#tooltip");

// Load and process both datasets
Promise.all([
  d3.csv("/data/Alcohol_GDP.csv"),
  d3.csv("/data/gdp_ppp_per_capita.csv"),
]).then(function ([alcoholData, gdpData]) {
  // Create a lookup object for GDP data by year
  const gdpLookup = {};
  gdpData.forEach((row) => {
    gdpLookup[row["Code"]] = {};
    for (let year = 2002; year <= 2014; year++) {
      gdpLookup[row["Code"]][year] = +row[year];
    }
  });

  // Combine alcohol data with GDP data
  const combinedData = alcoholData
    .map((d) => ({
      Country: d.Country,
      Code: d.Code,
      Year: +d.Year,
      "Alcohol Consumption (liters per capita)":
        +d["Alcohol Consuption, liters per capita"],
      "GDP per capita": gdpLookup[d.Code]?.[d.Year] || null,
    }))
    .filter((d) => d["GDP per capita"] !== null);

  // Declare gdpSlider
  const gdpSlider = document.getElementById("gdpSlider");

  // Function to get the current GDP range from the slider
  function getGDPRange() {
    const minGDP = parseFloat(gdpSlider.min);
    const maxGDP = parseFloat(gdpSlider.max);
    const selectedGDP = parseFloat(gdpSlider.value);
    return [minGDP, selectedGDP];
  }

  // Add variable to track currently selected bar
  let selectedBarData = null;

  // Function to reset highlighted countries
  function resetHighlightedCountries() {
    d3.selectAll(".bar").classed("selected", false);
    d3.selectAll("image").style("filter", null).style("opacity", 1);
    selectedBarData = null;
  }

  // Add click handler for background
  svg
    .append("rect")
    .attr("class", "background-rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent")
    .on("click", function (event) {
      if (event.target.classList.contains("background-rect")) {
        resetHighlightedCountries();
      }
    });

  // Function to highlight countries in a specific GDP range
  function highlightCountriesInRange(barData) {
    // Reset any previous highlighting
    resetHighlightedCountries();

    selectedBarData = barData;

    // Add selected class to clicked bar
    d3.selectAll(".bar").classed("selected", (d) => d === barData);

    // Highlight countries in the GDP range
    d3.selectAll("image")
      .style("filter", (d) => {
        const isInRange = d.gdp >= barData.x0 && d.gdp < barData.x1;
        return isInRange ? "brightness(1.2)" : "brightness(0.4)";
      })
      .style("opacity", (d) => {
        const isInRange = d.gdp >= barData.x0 && d.gdp < barData.x1;
        return isInRange ? 1 : 0.3;
      });
  }

  // Function to update the histogram
  function updateChart(selectedYear, gdpRange) {
    // Reset highlighting when updating chart
    resetHighlightedCountries();
    // Filter data for the selected year
    const yearData = combinedData.filter((d) => d.Year === +selectedYear);

    // Further filter based on the GDP range from the GDP slider
    const filteredData = yearData.filter(
      (d) =>
        d["GDP per capita"] >= gdpRange[0] && d["GDP per capita"] <= gdpRange[1]
    );

    // Update scales with the filtered data
    x.domain(d3.extent(filteredData, (d) => d["GDP per capita"]));
    y.domain(
      d3.extent(
        filteredData,
        (d) => d["Alcohol Consumption (liters per capita)"]
      )
    );

    // Create bins for the GDP data
    const bins = d3
      .bin()
      .value((d) => d["GDP per capita"])
      .domain(x.domain())
      .thresholds(x.ticks(20)); // 20 bins

    const binData = bins(filteredData);

    // Update color scale based on the maximum bin count
    const maxCount = d3.max(binData, (d) => d.length);
    color.domain([0, maxCount]);

    // Update axes with new scales
    xAxis.transition().duration(1000).call(d3.axisBottom(x));
    yAxis.transition().duration(1000).call(d3.axisLeft(y));

    // Bind bin data to the bars
    const bars = svg.selectAll(".bar").data(binData);

    // Remove old bars
    bars.exit().remove();

    // Enter and update bars
    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .merge(bars)
      .transition()
      .duration(1000)
      .attr("x", (d) => x(d.x0))
      .attr("y", (d) =>
        y(d3.max(d, (g) => g["Alcohol Consumption (liters per capita)"]) || 0)
      )
      .attr("width", (d) => x(d.x1) - x(d.x0) - 1)
      .attr(
        "height",
        (d) =>
          height -
          y(d3.max(d, (g) => g["Alcohol Consumption (liters per capita)"]) || 0)
      )
      .attr("fill", (d) => color(d.length))
      .selection() 
      .on("click", (event, d) => highlightCountriesInRange(d)); 
    // Add tooltip interactions
    svg
      .selectAll(".bar")
      .on("mouseover", function (event, d) {
        const countryCount = d.length;
        const maxAlcohol =
          d3.max(d, (g) => g["Alcohol Consumption (liters per capita)"]) || 0;
        const avgAlcohol =
          d3.mean(d, (g) => g["Alcohol Consumption (liters per capita)"]) || 0;

        tooltip
          .style("opacity", 1)
          .html(
            `GDP Range: $${d.x0.toFixed(0)} - $${d.x1.toFixed(0)}<br>
                 Countries in range: ${countryCount}<br>
                 Max Alcohol Consumption: ${maxAlcohol.toFixed(2)} liters<br>
                 Avg Alcohol Consumption: ${avgAlcohol.toFixed(2)} liters`
          )
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });
  }

  // Add event listener to year slider to update both histogram and scatterplot
  const yearSlider = document.getElementById("year-slider");
  const yearValueElement = document.getElementById("year-value");

  // Initialize the displayed year value with the slider's initial value
  yearValueElement.textContent = yearSlider.value; // Display initial year value

  // Add event listener to the year slider
  yearSlider.addEventListener("input", function () {
    const selectedYear = this.value;

    // Update the displayed year value directly
    yearValueElement.textContent = selectedYear; // Update displayed year

    // Update the histogram and scatterplot
    updateChart(selectedYear, getGDPRange()); // Update with GDP range
  });

  // Initialize the histogram with the last available year (2014)
  const initialGDPRange = getGDPRange(); // Initial GDP range
  updateChart(2014, initialGDPRange);

  // Add event listener for the GDP slider
  gdpSlider.addEventListener("input", function () {
    const selectedYear = yearSlider.value; // Get the selected year from the year slider

    // Update the histogram and scatterplot based on the GDP slider
    updateChart(selectedYear, getGDPRange()); // Update with GDP range
  });
});

// End of the Alcohol/GDP histogram

// Create the SVG container for the radial chart
const radialSvg = d3
  .select("#radial-chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${width / 2},${height / 2})`);

// Create a title for the radial chart
const title = radialSvg
  .append("text")
  .attr("class", "chart-title")
  .attr("text-anchor", "middle")
  .attr("x", -margin.left + 50)
  .attr("y", -height / 2 - 50)
  .attr("transform", "rotate(-90)")
  .style("font-size", "16px")
  .style("fill", "#333");

// Color scale for the radial bars
const radialColorScale = d3
  .scaleSequential()
  .interpolator(d3.interpolatePurples);

// Tooltip for displaying information on hover
const tooltipRadial = d3
  .select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("opacity", 0);

// Function to update the radial chart
function updateRadialChart(selectedYear, selectedIssue, gdpThreshold) {
  Promise.all([
    d3.csv("data/MentalDisorder_Age.csv"),
    d3.csv("data/gdp_ppp_per_capita.csv")
  ]).then(([mentalData, gdpData]) => {
    // Filter mental health data for the selected year
    const yearData = mentalData.filter((d) => d.Year === selectedYear);

    // Create a map of countries that meet the GDP threshold for the selected year
    const validCountries = new Set(
      gdpData.filter(d => +d[selectedYear] >= gdpThreshold)
        .map(d => d['Country Name'])
    );

    // Aggregate data for the selected issue, filtering by GDP threshold
    const aggregatedData = d3.rollup(
      yearData.filter(d => validCountries.has(d['Country'])),
      v => d3.mean(v, d => +d[selectedIssue]), // Calculate the mean value for each age group
      d => d["Age Group"]
    );

    // Convert aggregated data to an array format that D3 can use
    const processedData = Array.from(aggregatedData, ([ageGroup, value]) => ({
      ageGroup,
      value
    }));

    // Filter out NaN values (if any)
    const validProcessedData = processedData.filter((d) => !isNaN(d.value));

    // Set up scales
    const angleScale = d3
      .scaleBand()
      .domain(validProcessedData.map((d) => d.ageGroup))
      .range([0, 2 * Math.PI])
      .padding(0.1);

    const radiusScale = d3
      .scaleLinear()
      .domain([0, d3.max(validProcessedData, (d) => d.value)])
      .range([radiusInnerRadius, radiusOuterRadius]);

    // Update color scale domain
    radialColorScale.domain([0, d3.max(validProcessedData, (d) => d.value)]);

    // Add or update bars
    const bars = radialSvg.selectAll(".radial-bar").data(validProcessedData);

    // Remove old bars
    bars.exit()
      .transition()
      .duration(500)
      .style("opacity", 0)
      .remove();

    // Add new bars 
    bars.enter()
      .append("path")
      .attr("class", "radial-bar")
      .attr(
        "d",
        d3
          .arc()
          .innerRadius(radiusInnerRadius)
          .outerRadius((d) => radiusScale(d.value)) 
          .startAngle((d) => angleScale(d.ageGroup))
          .endAngle((d) => angleScale(d.ageGroup) + angleScale.bandwidth())
          .padAngle(0.02)
          .padRadius(radiusInnerRadius)
      )
      .style("fill", (d) => radialColorScale(d.value))
      .style("opacity", 0) 
      .transition()
      .duration(1000) 
      .style("opacity", 1); 

    // Update existing bars 
    bars.transition()
      .duration(1000) 
      .attr(
        "d",
        d3
          .arc()
          .innerRadius(radiusInnerRadius)
          .outerRadius((d) => radiusScale(d.value))
          .startAngle((d) => angleScale(d.ageGroup))
          .endAngle((d) => angleScale(d.ageGroup) + angleScale.bandwidth())
          .padAngle(0.02)
          .padRadius(radiusInnerRadius)
      )
      .style("fill", (d) => radialColorScale(d.value));

    // Set up age group labels (only if they don't exist)
    const labels = radialSvg.selectAll(".age-group-label").data(validProcessedData);

    // Only create new labels if they don't exist
    labels.enter()
      .append("text")
      .attr("class", "age-group-label")
      .attr("transform", (d) => {
        const angle = angleScale(d.ageGroup) + angleScale.bandwidth() / 2;
        const radius = radiusOuterRadius + 30;
        return `
          rotate(${(angle * 180) / Math.PI - 90})
          translate(${radius},0)
          rotate(${angle > Math.PI ? 180 : 0})
        `;
      })
      .attr("text-anchor", "middle")
      .text((d) => d.ageGroup)
      .style("font-size", "12px")
      .style("fill", "#666");

    // Update the title
    title.text(`${selectedIssue} (GDP ≥ ${gdpThreshold.toLocaleString()})`);

    // Add tooltip interactions
    radialSvg
      .selectAll(".radial-bar")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .style("opacity", 0.8);
        tooltipRadial
          .style("opacity", 0.9)
          .html(
            `<strong>Age Group:</strong> ${d.ageGroup}<br>` +
            `<strong>${selectedIssue}:</strong> ${d.value.toFixed(2)}%`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        d3.select(this)
          .style("opacity", 1);
        tooltipRadial
          .style("opacity", 0);
      });
  });
}

// Event listeners for all controls
d3.select("#year-slider").on("input", function () {
  const selectedYear = this.value;
  const selectedIssue = d3.select("#issueSelect").property("value");
  const gdpThreshold = +d3.select("#gdpSlider").property("value");
  d3.select("#year-label").text(selectedYear);
  updateRadialChart(selectedYear, selectedIssue, gdpThreshold);
});

d3.select("#issueSelect").on("change", function () {
  const selectedYear = d3.select("#year-slider").property("value");
  const selectedIssue = this.value;
  const gdpThreshold = +d3.select("#gdpSlider").property("value");
  updateRadialChart(selectedYear, selectedIssue, gdpThreshold);
});

d3.select("#gdpSlider").on("input", function() {
  const selectedYear = d3.select("#year-slider").property("value");
  const selectedIssue = d3.select("#issueSelect").property("value");
  const gdpThreshold = +this.value;
  updateRadialChart(selectedYear, selectedIssue, gdpThreshold);
});

// Initial chart display
updateRadialChart("2014", "Schizophrenia", 0);

// End of the Radial Chart