import "./App.css";
import React, { useState } from "react";
import { Tabs, Tab } from "@mui/material";
import AssignResources from "./AssignResources";
import SetKeyDates from "./SetKeyDates";
import Gantt from "./Gantt";
import Parameters from "./Parameters";
import Holidays from "./Holidays";

function App() {
  const [tabValue, changeTabValue] = useState(0);
  document.title = "Study Resource Management";

  return (
    <div className="App">
      <Tabs
        value={tabValue}
        onChange={(event, newValue) => {
          changeTabValue(newValue);
        }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Set Key Dates" id={"tab0"} sx={{ fontSize: 12 }} />
        <Tab label="Assign Resources" id={"tab1"} sx={{ fontSize: 12 }} />
        <Tab label="Study Gantt" id={"tab2"} sx={{ fontSize: 12 }} />
        <Tab label="Person Gantt" id={"tab3"} sx={{ fontSize: 12 }} />
        <Tab label="Parameters" id={"tab4"} sx={{ fontSize: 12 }} />
        <Tab label="Holidays" id={"tab5"} sx={{ fontSize: 12 }} />
      </Tabs>
      {tabValue === 0 && <SetKeyDates />}
      {tabValue === 1 && <AssignResources />}
      {tabValue === 2 && <Gantt type="study" />}
      {tabValue === 3 && <Gantt type="person" />}
      {tabValue === 4 && <Parameters />}
      {tabValue === 5 && <Holidays />}
    </div>
  );
}

export default App;
