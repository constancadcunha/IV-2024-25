---

# **Beyond the Numbers: Mental Health Dashboard**

### **Project Overview**
The **Mental Health Dashboard** is an interactive web application that visualizes the relationship between mental health, GDP per capita, alcohol consumption, and age group distributions. Using D3.js, the application features various visual idioms such as scatter plots, histograms, and radial bar charts, allowing users to explore the impact of economic and demographic factors on mental health issues across countries.

---

### **Features**
- **Scatterplot**: Compares mental health issues with GDP per capita, using country flags to represent each data point.
- **Histogram**: Displays the relationship between alcohol consumption and GDP per capita, allowing filtering by year.
- **Radial Bar Chart**: Visualizes mental health issues by age group.
- **Interactivity**: Users can select specific mental health issues, filter by GDP and year, and watch the charts dynamically update with smooth transitions.
  
---

### **Technologies Used**
- **D3.js**: For data visualization.
- **HTML/CSS**: For structure and styling.
- **JavaScript**: For handling data, events, and updating the visualizations dynamically.

---

### **Installation & Setup**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/mental-health-dashboard.git
   cd mental-health-dashboard
   ```

2. **Open `index.html` in your browser**:
   You can simply open the `index.html` file in any modern web browser to view the dashboard locally.

---

### **File Structure**

- **index.html**: Main structure of the dashboard, containing the layout of the visualizations and control elements.
- **script.js**: Contains all the logic for data loading, processing, and D3.js visualization creation.
- **style.css**: Defines the styling of the dashboard, including layout, colors, and transitions.

---

### **How to Use**
1. **Scatterplot**: 
   - The scatterplot shows the relationship between GDP per capita and the selected mental health issue (Schizophrenia, Depression, Bipolar, Anxiety). Country flags are scaled by population.
   - You can filter the data using the GDP range slider and select different years using the year slider.
   
2. **Histogram**:
   - The histogram displays the relationship between alcohol consumption and GDP per capita. Bars represent countries in different GDP ranges.
   - Clicking on a histogram bar will highlight the countries that fall within the corresponding GDP range on the scatterplot.
   
3. **Radial Bar Chart**:
   - This chart shows the distribution of mental health issues by age group. It dynamically updates based on the selected mental health issue and GDP threshold.

4. **Controls**:
   - The **Mental Health Issue dropdown** lets you choose which mental health factor to compare.
   - The **Year slider** allows you to filter data by year (2002–2014).
   - The **GDP range slider** lets you filter countries based on their GDP per capita.

---

### **Customization and Future Improvements**

- **Adjusting Flag Sizes**: The sizes of country flags in the scatterplot are determined by population. You can modify this in `script.js` using the `flagScale` function if needed.
- **Chart Layout**: The layout is flexible, and the positioning of the charts and controls can be customized in the CSS file. The controls are currently placed on the right side of the dashboard for better interaction.

---

### **Known Issues / Improvements**
- The **placeholder chart** for Anxiety by Age is still under construction. Future iterations will replace this with a more detailed visualization.
- Currently, the year slider and dropdown affect all three visualizations, but additional visual idioms or comparisons could be added to enrich the data exploration experience.

---

### **Contributions**
If you'd like to contribute to the project, feel free to fork the repository and create a pull request. Suggestions for new features, improvements, and bug fixes are welcome.

---

### **License**
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
