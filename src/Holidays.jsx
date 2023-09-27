import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import localUserHolidaysJson from "./samples/user_holidays.json"; // made with SAS program
import { getJsonFile } from "./utility";
function Holidays(props) {
  const { href } = window.location,
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    [userHolidays, setUserHolidays] = useState(null),
    webDavPrefix = "https://xarprod.ondemand.sas.com/lsaf/webdav/repo",
    userJsonDir = webDavPrefix + "/general/biostat/metadata/projects/rm";

  // load initial files
  useEffect(() => {
    if (mode === "local") {
      setUserHolidays(localUserHolidaysJson); // sample data for user holidays from sas program that reads spreadsheet
      console.log("localUserHolidaysJson", localUserHolidaysJson);
    } else {
      getJsonFile(userJsonDir + "/user_holidays.json", setUserHolidays); // data for user holidays from spreadsheet via SAS program
    }
  }, [mode, userJsonDir, setUserHolidays]);

  return (
    <Box sx={{ mt: 6 }}>
      <h1>Holidays</h1>to be added in future to replace use of{" "}
      <a
        href="https://argenxbvba.sharepoint.com/:x:/r/sites/Biostatistics/Shared%20Documents/STAR%20admin/_STAR_Holidays.xlsx?d=w175109c0c40d4bd48714cda85ce8a7ef&csf=1&web=1&e=SeaVF3"
        target="_blank"
        rel="noreferrer"
      >
        EXCEL sheet
      </a>
      . <br />
      User Holidays loaded with{" "}
      {userHolidays ? userHolidays.holidays.length : "?"} records for holidays.
    </Box>
  );
}

export default Holidays;
