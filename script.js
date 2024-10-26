// Set up dimensions and margins
const margin = { top: 20, right: 30, bottom: 35, left: 60 };
const width = 660 - margin.left - margin.right;
const scatterWidth = 1400 - margin.left - margin.right;
const height = 350 - margin.top - margin.bottom;
const scatterHeight = 350 - margin.top - margin.bottom;
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

// Helper function to find histogram bar for a GDP value
function findHistogramBar(gdp, binData) {
  return binData.find(bin => gdp >= bin.x0 && gdp < bin.x1);
}

// Global variable to track selected country
let selectedCountry = null;

// Modify the resetHighlightedCountries function to handle both visualizations
function resetHighlightedCountries() {
  d3.selectAll(".highlight-line").remove();
  d3.selectAll(".bar").classed("selected", false);
  d3.selectAll("image")
    .style("filter", null)
    .style("opacity", 1);
  selectedCountry = null;
}

function formatTooltip(data) {
  return Object.entries(data)
    .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
    .join("<br>");
}

// Populate two separate dropdowns: one for continents and one for countries
function populateDropdowns() {
  fetch("https://restcountries.com/v3.1/all")
      .then((response) => response.json())
      .then((data) => {
          const continentSelect = document.getElementById("continentSelect");
          const countrySelect = document.getElementById("countrySelect");

          // Create Sets to collect unique continents and countries
          const continents = new Set();
          const countries = [];

          data.forEach((country) => {
              if (country.region) continents.add(country.region);
              countries.push(country.name.common);

              // Map country to continent for easy lookup
              countryToContinent[country.name.common] = country.region;
          });

          // Sort and add continents to the dropdown
          Array.from(continents).sort().forEach((continent) => {
              const option = document.createElement("option");
              option.value = continent;
              option.textContent = continent;
              continentSelect.appendChild(option);
          });

          // Sort and add countries to the dropdown
          countries.sort().forEach((country) => {
              const option = document.createElement("option");
              option.value = country;
              option.textContent = country;
              countrySelect.appendChild(option);
          });
      })
      .catch((error) => console.error("Error fetching countries:", error));
}

const countryToContinent = {}; // Store country-continent mapping
populateDropdowns(); // Call function to populate the dropdowns

// Function to reset highlights when a new selection is made
function resetHighlightedCountries() {
  d3.selectAll(".highlight-line").remove();
  d3.selectAll(".bar").classed("selected", false);
  d3.selectAll("image")
    .style("filter", null)
    .style("opacity", 1);
  selectedCountry = null;
}

// Event listener for continent dropdown
d3.select("#continentSelect").on("change", function () {
  const selectedContinent = this.value;
  
  if (selectedContinent === "All") {
      highlightSelectedCountries(null);  // Pass null to reset highlights
  } else {
      const countriesToHighlight = Object.keys(countryToContinent).filter(
          (country) => countryToContinent[country] === selectedContinent
      );
      highlightSelectedCountries(countriesToHighlight);
  }
});

// Event listener for country dropdown
d3.select("#countrySelect").on("change", function() {
  const selectedCountry = this.value;
  
  if (selectedCountry === "All") {
    resetAllHighlights();
  } else {
    highlightSelectedCountries([selectedCountry]);
  }
});

// Function to reset highlights without affecting histogram line
function resetScatterHighlightsOnly() {
  d3.selectAll("image")
    .style("filter", null)
    .style("opacity", 1);
}

// Function to reset all highlights including histogram
function resetAllHighlights() {
  d3.selectAll(".highlight-line").remove();
  d3.selectAll(".bar").classed("selected", false);
  d3.selectAll("image")
    .style("filter", null)
    .style("opacity", 1);
  selectedCountry = null;
}

// Separate function for highlighting countries by continent
function highlightCountriesByContinent(countries) {
  if (!countries || countries.length === 0) {
    resetScatterHighlightsOnly();
    return;
  }

  // Only highlight in scatterplot, don't affect histogram
  d3.selectAll("image")
    .style("filter", (d) => countries.includes(d.country) ? "brightness(1.2)" : "brightness(0.4)")
    .style("opacity", (d) => countries.includes(d.country) ? 1 : 0.3);
}

// Updated event listener for continent dropdown
d3.select("#continentSelect").on("change", function() {
  const selectedContinent = this.value;
  
  if (selectedContinent === "All") {
    resetScatterHighlightsOnly();
  } else {
    const countriesToHighlight = Object.keys(countryToContinent).filter(
      (country) => countryToContinent[country] === selectedContinent
    );
    highlightCountriesByContinent(countriesToHighlight);
  }
});

function highlightSelectedCountries(countries) {
  // Reset previous highlights
  resetAllHighlights();

  if (!countries || countries.length === 0) return;

  // Check if we're highlighting a single country
  if (countries.length === 1) {
    // Find the corresponding GDP data for the selected country
    const countryData = d3.selectAll("image").data()
      .find(d => countries.includes(d.country));

    if (countryData) {
      // Highlight in scatterplot
      d3.selectAll("image")
        .style("filter", (d) => countries.includes(d.country) ? "brightness(1.2)" : "brightness(0.4)")
        .style("opacity", (d) => countries.includes(d.country) ? 1 : 0.3);

      // Find the corresponding histogram bar
      const histogramBars = d3.select("#histogram").selectAll(".bar");
      const binData = histogramBars.data();
      const correspondingBin = findHistogramBar(countryData.gdp, binData);

      if (correspondingBin) {
        // Highlight the corresponding histogram bar
        histogramBars.classed("selected", (bin) => bin === correspondingBin);

        // Find alcohol consumption data for the selected country
        const yearData = combinedData.find(item => 
          item.Country === countryData.country && 
          item.Year === +d3.select("#year-slider").property("value")
        );

        if (yearData) {
          // Draw the histogram line and label
          const histogramSvg = d3.select("#histogram").select("svg").select("g");
          const alcoholConsumption = yearData["Alcohol Consumption (liters per capita)"];
          
          histogramSvg.append("line")
            .attr("class", "highlight-line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(alcoholConsumption))
            .attr("y2", y(alcoholConsumption));

          histogramSvg.append("text")
            .attr("class", "highlight-line")
            .attr("x", width - 10)
            .attr("y", y(alcoholConsumption) - 8)
            .attr("text-anchor", "end")
            .text(`${countryData.country}: ${alcoholConsumption.toFixed(1)}L`);
        }
      }
    }
  } else {
    // For multiple countries (continent selection), only highlight in scatterplot
    highlightCountriesByContinent(countries);
  }
}

d3.select("#locationSelect").on("change", function () {
  const selectedLocation = this.value;
  const isContinent = Object.values(countryToContinent).includes(selectedLocation);
  
  const countriesToHighlight = isContinent
      ? Object.keys(countryToContinent).filter(
            (country) => countryToContinent[country] === selectedLocation
        )
      : [selectedLocation];

  highlightSelectedCountries(countriesToHighlight);
});

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

    svg.insert("rect", ":first-child") // Insert as first child to be behind everything
    .attr("class", "background-rect")
    .attr("width", scatterWidth)
    .attr("height", scatterHeight)
    .attr("fill", "transparent")
    .on("click", () => {
      resetHighlightedCountries();
    });

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
    xAxis.transition().duration(1000).call(d3.axisBottom(xScale).tickFormat(formatNumber));
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
    svg.selectAll("image")
    .on("mouseover", (event, d) => {
      const tooltipData = {
        Country: d.country,
        "GDP per capita": `$${formatNumber(d.gdp)}`,
        "Country population": formatNumber(d.population),
        [`People with ${selectedIssue}`]: `${formatNumber((d.value / 100) * d.population)} (${d.value.toFixed(2)}%)`
      };
      
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
      tooltip.html(formatTooltip(tooltipData))
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .on("click", (event, d) => {
      event.stopPropagation();

      // If clicking the same country, deselect it
      if (selectedCountry === d.country) {
        resetHighlightedCountries();
        return;
      }

      // Store the selected country
      selectedCountry = d.country;

      // Reset previous highlights
      resetHighlightedCountries();

      // Highlight selected country in scatter plot
      d3.selectAll("image")
        .style("filter", (img) => img.country === d.country ? "brightness(1.2)" : "brightness(0.4)")
        .style("opacity", (img) => img.country === d.country ? 1 : 0.3);

      // Find and highlight corresponding histogram bar
      const histogramBars = d3.select("#histogram").selectAll(".bar");
      const binData = histogramBars.data();
      const correspondingBin = findHistogramBar(d.gdp, binData);
      
      if (correspondingBin) {
        histogramBars.classed("selected", (bin) => bin === correspondingBin);
        
        // Find alcohol consumption data for the selected country
        const yearData = combinedData.find(item => 
          item.Country === d.country && 
          item.Year === selectedYear
        );

        if (yearData) {
          // Remove any existing highlight line
          d3.select("#histogram").selectAll(".highlight-line").remove();

          // Draw the highlight line
          const histogramSvg = d3.select("#histogram").select("svg").select("g");
          const alcoholConsumption = yearData["Alcohol Consumption (liters per capita)"];
          
          histogramSvg.append("line")
            .attr("id", "highlight-line")
            .attr("class", "highlight-line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(alcoholConsumption))
            .attr("y2", y(alcoholConsumption))
            .transition()
            .duration(500)

          // Add label for the line
          histogramSvg.append("text")
            .attr("id", "highlight-text")
            .attr("class", "highlight-line")
            .attr("x", width - 5)
            .attr("y", y(alcoholConsumption) - 5)
            .attr("text-anchor", "end")
            .text(`${d.country}: ${alcoholConsumption.toFixed(1)} L`)
            .transition()
            .duration(500)
        }
      }
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

  d3.select("#histogram")
  .select("svg")
  .insert("rect", ":first-child")
  .attr("class", "background-rect")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("fill", "transparent")
  .on("click", () => {
    resetHighlightedCountries();
  });

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

let combinedData = [];

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

  // Store combined data globally
  combinedData = alcoholData
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
        (d) => d["GDP per capita"] >= gdpRange[0] && d["GDP per capita"] <= gdpRange[1]
    );

    // Update scales with the filtered data
    x.domain(d3.extent(filteredData, (d) => d["GDP per capita"]));
    y.domain(d3.extent(filteredData, (d) => d["Alcohol Consumption (liters per capita)"]));

    // Create bins for the GDP data
    const bins = d3.bin()
        .value((d) => d["GDP per capita"])
        .domain(x.domain())
        .thresholds(x.ticks(20)); // 20 bins

    const binData = bins(filteredData);

    // Update color scale based on the maximum bin count
    const maxCount = d3.max(binData, (d) => d.length);
    color.domain([0, maxCount]);

    // Update axes with new scales
    xAxis.transition()
        .duration(1000)
        .call(d3.axisBottom(x).tickFormat(formatNumber));
    
    yAxis.transition()
        .duration(1000)
        .call(d3.axisLeft(y).tickFormat(formatNumber));

    // Ensure background click handler is in place
    const existingBackground = svg.select(".background-rect");
    if (existingBackground.empty()) {
        svg.insert("rect", ":first-child")
            .attr("class", "background-rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent")
            .on("click", () => {
                resetHighlightedCountries();
            });
    }

    // Bind bin data to the bars
    const bars = svg.selectAll(".bar").data(binData);

    // Remove old bars
    bars.exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();

    // Enter new bars
    const barsEnter = bars.enter()
        .append("rect")
        .attr("class", "bar");

    // Update and merge bars
    bars.merge(barsEnter)
        .transition()
        .duration(1000)
        .attr("x", (d) => x(d.x0))
        .attr("y", (d) => y(d3.max(d, (g) => g["Alcohol Consumption (liters per capita)"]) || 0))
        .attr("width", (d) => x(d.x1) - x(d.x0) - 1)
        .attr("height", (d) => height - y(d3.max(d, (g) => g["Alcohol Consumption (liters per capita)"]) || 0))
        .attr("fill", (d) => color(d.length));

    // Add interaction handlers to all bars (both new and updated)
    svg.selectAll(".bar")
        .on("mouseover", function(event, d) {
            const tooltipData = {
                "GDP Range": `$${formatNumber(d.x0)} - $${formatNumber(d.x1)}`,
                "Countries in range": d.length,
                "Max Alcohol Consumption": `${formatNumber(d3.max(d, g => g["Alcohol Consumption (liters per capita)"]) || 0)} liters`,
                "Avg Alcohol Consumption": `${formatNumber(d3.mean(d, g => g["Alcohol Consumption (liters per capita)"]) || 0)} liters`
            };
            
            tooltip.style("opacity", 1)
                .html(formatTooltip(tooltipData))
                .style("left", `${event.pageX}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => tooltip.style("opacity", 0))
        .on("click", function(event, d) {
            event.stopPropagation();

            // If clicking the same bar, deselect everything
            if (d3.select(this).classed("selected")) {
                resetHighlightedCountries();
                return;
            }

            // Reset previous highlights
            resetHighlightedCountries();

            // Highlight the clicked bar
            d3.selectAll(".bar")
                .classed("selected", (bin) => bin === d);

            // Highlight corresponding countries in scatter plot
            d3.selectAll("image")
                .style("filter", (country) => {
                    const isInRange = country.gdp >= d.x0 && country.gdp < d.x1;
                    return isInRange ? "brightness(1.2)" : "brightness(0.4)";
                })
                .style("opacity", (country) => {
                    const isInRange = country.gdp >= d.x0 && country.gdp < d.x1;
                    return isInRange ? 1 : 0.3;
                });

            // Store the selected GDP range for reference
            selectedBarData = d;
        });

    // If there was a previously selected bar, reapply the highlighting
    if (selectedBarData) {
        const matchingBar = svg.selectAll(".bar")
            .filter(d => d.x0 === selectedBarData.x0 && d.x1 === selectedBarData.x1);
        
        if (!matchingBar.empty()) {
            matchingBar.classed("selected", true);
            
            // Reapply country highlighting
            d3.selectAll("image")
                .style("filter", (country) => {
                    const isInRange = country.gdp >= selectedBarData.x0 && country.gdp < selectedBarData.x1;
                    return isInRange ? "brightness(1.2)" : "brightness(0.4)";
                })
                .style("opacity", (country) => {
                    const isInRange = country.gdp >= selectedBarData.x0 && country.gdp < selectedBarData.x1;
                    return isInRange ? 1 : 0.3;
                });
        }
    }
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
    radialSvg.selectAll(".radial-bar")
      .on("mouseover", function (event, d) {
        const tooltipData = {
          "Age Group": d.ageGroup,
          [selectedIssue]: `${formatNumber(d.value)}%`
        };
        
        d3.select(this).style("opacity", 0.8);
        tooltipRadial.style("opacity", 0.9)
          .html(formatTooltip(tooltipData))
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function () {
        d3.select(this).style("opacity", 1);
        tooltipRadial.style("opacity", 0);
      })
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
