---

# **Beyond the Numbers: Mental Health Dashboard**

### **Project Overview**
The **Mental Health Dashboard** is an interactive web application that visualizes the relationship between mental health, GDP per capita, alcohol consumption, and age group distributions. Developed using D3.js, this application leverages various visual idioms like scatter plots, histograms, and radial bar charts, enabling users to explore the impact of economic and demographic factors on mental health issues worldwide.

### **Features**
- **Scatterplot**: Compares mental health issues with GDP per capita, using country flags to represent each data point, with flag sizes scaled by population.
- **Histogram**: Displays the relationship between alcohol consumption and GDP per capita, allowing filtering by year and highlighting selected GDP ranges.
- **Radial Bar Chart**: Visualizes the prevalence of mental health issues by age group, dynamically adjusting to the selected mental health issue and GDP range.
- **Interactivity**: Users can interactively filter by mental health issues, GDP range, and year with dynamic transitions updating the visuals.

### **Technologies Used**
- **D3.js**: For data visualization.
- **HTML/CSS**: Provides structure and styling.
- **JavaScript**: Manages data handling, event listeners, and visualization updates.

---

### **Installation & Setup**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/mental-health-dashboard.git
   cd mental-health-dashboard
   ```
   
2. **Browser Compatibility**:
   - This dashboard is optimized for **Google Chrome (latest version)**. It may not display as intended in other browsers due to certain D3.js functionalities.

3. **Open `index.html`**:
   - Simply open the `index.html` file in **Google Chrome** to start the application locally.

### **File Structure**

- **index.html**: Contains the dashboard’s layout, including controls for selecting data parameters.
- **script.js**: Holds all logic for data loading, processing, and D3.js visualization.
- **style.css**: Styles the dashboard, including layout, color schemes, and transitions for a cohesive look.

---

### **How to Use**

1. **Scatterplot**: 
   - Visualizes GDP per capita against the selected mental health issue (options include Schizophrenia, Depression, Bipolar, Anxiety), with each country's flag size indicating population.
   - Adjust filters using the GDP range slider and year selector.

2. **Histogram**:
   - Shows the relationship between alcohol consumption and GDP per capita, with each bar representing countries in different GDP ranges.
   - Clicking a histogram bar highlights countries within the selected GDP range on the scatterplot.

3. **Radial Bar Chart**:
   - Displays mental health issues by age group, dynamically adjusting to the selected mental health issue and GDP threshold.
   - The color intensity represents the prevalence of mental health issues within each age group.

4. **Controls**:
   - **Mental Health Issue Dropdown**: Choose a mental health issue to visualize across all charts.
   - **Year Slider**: Select a specific year (2002–2014) to filter data.
   - **GDP Range Slider**: Limit countries based on GDP per capita to focus on specific economic tiers.

---

### **Customization and Future Improvements**

- **Flag Sizes in Scatterplot**: The sizes of flags, representing country populations, can be adjusted in `script.js` via the `flagScale` function.
- **Layout Adjustments**: The layout and positioning of charts and controls can be modified in `style.css`. Currently, controls are centered to enhance usability.
- **Future Enhancements**:
   - Replace the **placeholder radial chart** for Anxiety by Age with a more comprehensive visualization.
   - Add additional comparison tools to enrich data exploration options.

---

### **Known Issues / Improvements**
- **Cross-browser Support**: Optimized for Google Chrome, with potential compatibility issues on other browsers.
- **Anxiety by Age**: Placeholder visualization under construction, with plans to implement a detailed age-distribution chart in future updates.
- **Data Synchronization**: While all three visualizations synchronize with the filters, additional idioms could enhance data exploration.

---

### **Contributions**
Contributions are welcome! Please follow these steps:
1. **Fork** the repository.
2. **Create a new branch**:
   ```bash
   git checkout -b feature/YourFeatureName
   ```
3. **Commit and push** your changes:
   ```bash
   git commit -m "Add your feature description"
   git push origin feature/YourFeatureName
   ```
4. Submit a pull request for review.

Suggestions for new features, enhancements, and bug fixes are appreciated.

### **License**
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
