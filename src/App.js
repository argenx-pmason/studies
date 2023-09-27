import "./App.css";
import React, { useEffect, useState } from "react";
import {
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  AppBar,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import AssignResources from "./AssignResources";
import SetKeyDates from "./SetKeyDates";
import Gantt from "./Gantt";
import Parameters from "./Parameters";
import Holidays from "./Holidays";

function App() {
  document.title = "Study Resource Management";
  const [tabValue, changeTabValue] = useState(0),
    [openInfo, setOpenInfo] = useState(true),
    saveUser = () => {
      localStorage.setItem("username", tempUsername);
      setOpenInfo(false);
    },
    [tempUsername, setTempUsername] = useState(""),
    [openSnackbar, setOpenSnackbar] = useState(false),
    handleCloseSnackbar = (event, reason) => {
      if (reason === "clickaway") {
        return;
      }
      setOpenSnackbar(false);
    };
  let username = localStorage.getItem("username");

  useEffect(() => {
    console.log("username", username);
    if (username === null) {
      setTempUsername("");
      setOpenInfo(true);
    } else {
      setTempUsername(username);
      setOpenInfo(false);
      setOpenSnackbar(true);
    }
  }, [username]);

  return (
    <div className="App">
      <AppBar position="fixed" color="transparent">
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
      </AppBar>

      {tabValue === 0 && <SetKeyDates user={tempUsername} />}
      {tabValue === 1 && <AssignResources user={tempUsername} />}
      {tabValue === 2 && <Gantt type="study" user={tempUsername} />}
      {tabValue === 3 && <Gantt type="person" user={tempUsername} />}
      {tabValue === 4 && <Parameters user={tempUsername} />}
      {tabValue === 5 && <Holidays user={tempUsername} />}
      {/* dialog that prompts for a user name */}
      {!username && (
        <Dialog
          fullWidth
          maxWidth="sm"
          onClose={() => setOpenInfo(false)}
          open={openInfo}
          title={"User Login"}
        >
          <DialogTitle>Who are you?</DialogTitle>
          <DialogContent>
            {" "}
            <TextField
              id="input-with-icon-textfield"
              label="User Name"
              placeholder="e.g. pmason"
              value={tempUsername}
              onChange={(e) => {
                setTempUsername(e.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle />
                  </InputAdornment>
                ),
              }}
              variant="standard"
            />
            {/*  <TextField
                label={
                  access &&
                  access.length > 0 &&
                  access.filter((u) => u.userid === user).length > 0
                    ? "User ID (valid)"
                    : "Enter User ID"
                }
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                }}
                color={
                  access && access.filter((u) => u.userid === user).length > 0
                    ? "success"
                    : access === null
                    ? "warning"
                    : "error"
                }
                sx={{
                  width: "100%",
                }}
              /> */}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => saveUser()}>Save</Button>
          </DialogActions>
        </Dialog>
      )}
      {tempUsername && (
        <Snackbar
          severity="success"
          open={openSnackbar}
          autoHideDuration={7000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity="success"
            sx={{ width: "100%" }}
          >
            Welcome 👨‍🦲 {username}
          </Alert>
        </Snackbar>
      )}
    </div>
  );
}

export default App;
