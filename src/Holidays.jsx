import { useEffect, useState } from "react";
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

  return <h1>Holidays</h1>;
}

export default Holidays;
