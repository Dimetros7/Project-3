// Global variable to store the data
let globalData = [];

// Function to build the metadata panel
function buildMetadata(selectedCountries) {
    const PANEL = d3.select("#sample-metadata");
    PANEL.html(""); // Clear existing metadata

    let selectedData = globalData.filter(country => selectedCountries.includes(country.country));

    if (selectedData.length > 0) {
        selectedData.forEach(countryData => {
            PANEL.append("h5").text(`${countryData.country}`);

            Object.entries(countryData).forEach(([key, value]) => {
                if (key !== "country_id" && key !== "country") {
                    let formattedKey = key.replace(/_/g, ' ').toUpperCase();
                    let formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
                    PANEL.append("p").text(`${formattedKey}: ${formattedValue}`);
                }
            });

            PANEL.append("hr"); // Separate multiple countries
        });
    } else {
        PANEL.append("h6").text("No data available");
    }
}

// Function to update all charts with multiple selected countries
function updateCharts(selectedCountries) {
    let filteredData = globalData.filter(c => selectedCountries.includes(c.country));

    if (filteredData.length === 0) {
        console.warn("No data found for selected countries.");
        return;
    }

    createBarChart(filteredData);
    createBubbleChart(filteredData);
    createLineChart(filteredData);
    buildMetadata(selectedCountries);
}

// Function to create Bar Chart - Total Waste by Country
function createBarChart(countries) {
    let names = countries.map(c => c.country);
    let totalWaste = countries.map(c => c.total_plastic_waste_mt);
    let recycleRate = countries.map(c => c.recycling_rate);

    let trace1 = {
        x: names,
        y: totalWaste,
        type: 'bar',
        name: 'Total Plastic Waste (MT)',
        marker: { color: 'blue' }
    };

    let trace2 = {
        x: names,
        y: recycleRate,
        type: 'bar',
        name: 'Recycling Rate (%)',
        marker: { color: 'green' }
    };

    let layout = {
        title: 'Total Plastic Waste & Recycling Rate by Country',
        xaxis: { title: 'Country' },
        yaxis: { title: 'Value' },
        barmode: 'group'
    };

    Plotly.newPlot('bar', [trace1, trace2], layout);
}

// Function to create Bubble Chart - Per Capita Waste vs Recycling Rate
function createBubbleChart(countries) {
    let perCapitaWaste = countries.map(c => c.per_capita_waste_kg);
    let recyclingRate = countries.map(c => c.recycling_rate);
    let totalWaste = countries.map(c => c.total_plastic_waste_mt);

    let trace = {
        x: perCapitaWaste,
        y: recyclingRate,
        mode: 'markers',
        marker: {
            size: totalWaste.map(w => w * 2),
            color: totalWaste,
            colorscale: 'Viridis',
            opacity: 0.7
        },
        text: countries.map(c => c.country)
    };

    let layout = {
        title: 'Per Capita Waste vs Recycling Rate',
        xaxis: { title: 'Per Capita Waste (kg)' },
        yaxis: { title: 'Recycling Rate (%)' }
    };

    Plotly.newPlot('bubble', [trace], layout);
}
// Function to create a Bar Chart for Country vs Coastal Waste Risk
function createCoastalWasteChart(countries) {
    let names = countries.map(c => c.country);
    let riskLevels = countries.map(c => {
        const riskMapping = { "Low": 1, "Medium": 2, "High": 3, "Very_High": 4 };
        return riskMapping[c.coastal_waste_risk] || 0;
    });

    let trace = {
        x: names,
        y: riskLevels,
        type: 'bar',
        marker: {
            color: riskLevels,
            colorscale: 'YlOrRd',
            showscale: true
        },
        text: countries.map(c => `${c.country}: ${c.coastal_waste_risk}`)
    };

    let layout = {
        title: 'Country vs Coastal Waste Risk',
        xaxis: { title: 'Country', tickangle: -45 },
        yaxis: { title: 'Coastal Waste Risk Level', tickvals: [1, 2, 3, 4], ticktext: ["Low", "Medium", "High", "Very High"] }
    };

    Plotly.newPlot('coastal-waste-chart', [trace], layout);
}

// Function to create Line Chart - Recycling Rate by Country
function createLineChart(countries) {
    let names = countries.map(c => c.country);
    let recycleRate = countries.map(c => c.recycling_rate);

    let trace = {
        x: names,
        y: recycleRate,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: 'blue' }
    };

    let layout = {
        title: 'Recycling Rate by Country',
        xaxis: { title: 'Country' },
        yaxis: { title: 'Recycling Rate (%)' }
    };

    Plotly.newPlot('line', [trace], layout);
}

// Function to load data and initialize the dashboard
function init() {
    d3.json("../static/data/plastic_pollution.json").then((data) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error("Data is missing or improperly formatted");
        }

        console.log("Loaded Data", data);
        globalData = data; // Store data globally

        let dropdown = d3.select("#selDataset").attr("multiple", "multiple");
        data.forEach((country) => {
            dropdown.append("option")
                   .text(country.country)
                   .property("value", country.country);
        });

        // Initialize with the first country's data
        updateCharts([data[0].country]);
    }).catch(error => {
        console.error("Error loading the data:", error);
        document.body.innerHTML = `<div class="container mt-5">
            <div class="alert alert-danger">
                Error loading data. Please ensure the JSON file is in the correct location
                and you're running this through a web server.
            </div>
        </div>`;
    });
}

// Event listener for dropdown selection
d3.select("#selDataset").on("change", function() {
    let selectedOptions = Array.from(this.selectedOptions).map(option => option.value);
    if (selectedOptions.length === 0) {
        selectedOptions = [d3.select("#selDataset option").property("value")];
    }
    updateCharts(selectedOptions);
});

// Call init when the page loads
init();
