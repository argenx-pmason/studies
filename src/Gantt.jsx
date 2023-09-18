import { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  Button,
  Checkbox,
} from "@mui/material";
import { Info } from "@mui/icons-material";
import Highcharts from "highcharts";
import highchartsGantt from "highcharts/modules/gantt";
import highchartsMore from "highcharts/highcharts-more";
import HighchartsReact from "highcharts-react-official";
import { getJsonFile } from "./utility";
import localStudiesInfoJson from "./samples/studies_info.json"; // made with SAS program
import localUserHolidaysJson from "./samples/user_holidays.json"; // made with SAS program
import localAssignmentsJson from "./samples/assignments.json"; // made using app (or manually)
import localKeyDatesJson from "./samples/key_dates.json"; // made using app (or manually)
import localRolesLongShortJson from "./samples/roles_long_short.json"; // made manually
import localEventsToIncludeJson from "./samples/events_to_include.json"; // made manually
import localColorsForMilestonesJson from "./samples/colors_for_milestones.json"; // made manually

// initialize the module
highchartsGantt(Highcharts);
highchartsMore(Highcharts);

function Gantt(props) {
  const { type } = props,
    { href } = window.location,
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    webDavPrefix = "https://xarprod.ondemand.sas.com/lsaf/webdav/repo",
    userJsonDir = webDavPrefix + "/general/biostat/metadata/projects/rm",
    [info, setInfo] = useState(null),
    [openInfo, setOpenInfo] = useState(false),
    [studiesInfo, setStudiesInfo] = useState(null),
    [userHolidays, setUserHolidays] = useState(null),
    [rolesLongShort, setRolesLongShort] = useState(null),
    [eventsToInclude, setEventsToInclude] = useState(null),
    [colorsForMilestones, setColorsForMilestones] = useState(null),
    [scrollable, setScrollable] = useState(false),
    [globalCollapse, setGlobalCollapse] = useState(false),
    filename = "key_dates.json",
    [keyDates, setKeyDates] = useState(null),
    dateFormat = Highcharts.dateFormat,
    defined = Highcharts.defined,
    // isObject = Highcharts.isObject,
    topMargin = 200,
    // screenWidth = window.innerWidth,
    screenHeight = window.screen.availHeight,
    [chart, setChart] = useState(null),
    ganttItem = (
      id,
      study,
      name,
      from,
      to,
      milestone,
      parent,
      role,
      level,
      collapsed
    ) => {
      const date1 = new Date(from),
        start = date1.getTime(),
        date2 = new Date(to),
        end = date2.getTime();
      // console.log(info, "start", start, "end", end);
      return {
        id: id,
        name: type === "study" ? name : study,
        start: start,
        end: end,
        milestone: milestone,
        parent: parent,
        role: role,
        opacity: milestone ? 0.75 : 0.5,
        what: null,
        level: level,
        collapsed: collapsed ? collapsed : false,
      };
    };

  // load initial files
  useEffect(() => {
    if (mode === "local") {
      setInfo(localAssignmentsJson); // sample data for users assigned to studies
      setKeyDates(localKeyDatesJson); // sample data for dates set for studies
      setStudiesInfo(localStudiesInfoJson); // sample data for studies info mapping indications to studies
      setUserHolidays(localUserHolidaysJson); // sample data for user holidays from sas program that reads spreadsheet
      setRolesLongShort(localRolesLongShortJson); // sample data mapping roles from full length to short, for Gantt
      setEventsToInclude(localEventsToIncludeJson); // sample data for events (variables) to include as key dates on the Gantt
      setColorsForMilestones(localColorsForMilestonesJson); // sample data for events (variables) to include as key dates on the Gantt
    } else {
      getJsonFile(userJsonDir + "/" + filename, setKeyDates); // data for users assigned to studies
      getJsonFile(userJsonDir + "/assignments.json", setInfo); // data for users assigned to studies
      getJsonFile(userJsonDir + "/studies_info.json", setStudiesInfo); // data for users assigned to studies
      getJsonFile(userJsonDir + "/user_holidays.json", setUserHolidays); // data for user holidays from spreadsheet via SAS program
      getJsonFile(userJsonDir + "/roles_long_short.json", setRolesLongShort); // data mapping roles from full length to short, for Gantt
      getJsonFile(userJsonDir + "/events_to_include.json", setEventsToInclude); // data for events (variables) to include as key dates on the Gantt
      getJsonFile(
        userJsonDir + "/colors_for_milestones.json",
        setColorsForMilestones
      ); // colors to use for milestones, whose sequence matches the eventsToInclude
    }
  }, [mode, userJsonDir]);

  // when all data is loaded setup everything needed for the Gantt chart(s)
  useEffect(() => {
    // console.log(
    //   "start of useeffect - ",
    //   "type",
    //   type,
    //   "info",
    //   info,
    //   "rolesLongShort",
    //   rolesLongShort,
    //   "eventsToInclude",
    //   eventsToInclude,
    //   "keyDates",
    //   keyDates
    // );
    if (
      info === null ||
      keyDates === null ||
      studiesInfo === null ||
      userHolidays === null ||
      rolesLongShort === null ||
      eventsToInclude === null ||
      colorsForMilestones === null
    )
      return;
    // console.log("info", info);

    // apply shorter names for roles (we expect a role in rolesLongShort for every role in info)
    info.forEach((i) => {
      i.role = i.role in rolesLongShort ? rolesLongShort[i.role] : i.role;
    });

    // work out min and max dates at study level and person level
    const minStudy = info.reduce((res, i) => {
        res[i.study] = res[i.study]
          ? i.from < res[i.study]
            ? i.from
            : res[i.study]
          : i.from;
        return res;
      }, {}),
      maxStudy = info.reduce((res, i) => {
        res[i.study] = res[i.study]
          ? i.to > res[i.study]
            ? i.to
            : res[i.study]
          : i.to;
        return res;
      }, {}),
      minPerson = info.reduce((res, i) => {
        res[i.name] = res[i.name]
          ? i.from < res[i.name]
            ? i.from
            : res[i.name]
          : i.from;
        return res;
      }, {}),
      maxPerson = info.reduce((res, i) => {
        res[i.name] = res[i.name]
          ? i.to > res[i.name]
            ? i.to
            : res[i.name]
          : i.to;
        return res;
      }, {});

    // LOWER LEVEL data - get main data for each line of gantt chart (study or person gantt)
    // console.log(info);
    let sortedInfo = [...info].sort((a, b) => {
        if (a.name + a.study.toUpperCase() > a.name + b.study.toUpperCase())
          return 1;
        else if (
          a.name + a.study.toUpperCase() <
          a.name + b.study.toUpperCase()
        )
          return -1;
        else return 0;
      }),
      seriesData = sortedInfo.map((i) => {
        // id, study, name, from, to, milestone, parent, role
        return ganttItem(
          i.id,
          i.study,
          i.name,
          i.from,
          i.to,
          false,
          type === "study" ? i.study : i.prod_ind + "/" + i.name,
          i.role,
          "3",
          globalCollapse
        );
      });
    // console.log(sortedInfo);

    // MID LEVEL data - add parent lines in gantt
    const indications = new Set(),
      studies = new Set();
    Object.keys(minStudy).forEach((k) => {
      studies.add(k);
    });
    // console.log("studies", studies);
    if (type === "study") {
      Object.keys(minStudy).forEach((k) => {
        // console.log("k", k);
        indications.add(studiesInfo[k]); // create set of unique indications
        // add study level
        seriesData.push(
          // id, study, name, from, to, milestone, parent, role
          ganttItem(
            k,
            null,
            k,
            minStudy[k],
            maxStudy[k],
            false,
            studiesInfo[k],
            null,
            "2b",
            globalCollapse
          )
        );
      });
    } else if (type === "person") {
      info.forEach((i) => {
        // add item for compound unless it already exists
        const id = i.prod_ind + "/" + i.name;
        if (seriesData.filter((s) => s.id === id).length === 0)
          seriesData.push({
            id: i.prod_ind + "/" + i.name,
            name: i.prod_ind,
            start: null,
            end: null,
            milestone: false,
            parent: i.name,
            role: null,
            what: null,
            level: "2b",
            collapsed: globalCollapse,
          });
      });
    }
    // console.log("indications", indications, "seriesData", seriesData);

    // TOP LEVEL data
    // add product/indication parent lines
    if (type === "study") {
      indications.forEach((ind) => {
        // console.log("ind", ind);
        // add compound level
        seriesData.push({
          id: ind,
          name: ind,
          start: null,
          end: null,
          milestone: false,
          parent: null,
          role: null,
          what: null,
          level: "1",
          collapsed: globalCollapse,
        });
      });
    } else if (type === "person") {
      Object.keys(minPerson).forEach((k) => {
        // console.log("k", k);
        seriesData.push(
          // id, study, name, from, to, milestone, parent, role, level, collapsed
          ganttItem(
            k,
            k,
            null,
            minPerson[k],
            maxPerson[k],
            false,
            null,
            null,
            "1",
            globalCollapse
          )
        );
      });
    }

    // add KEY DATES to show on gantt
    if (type === "study") {
      // console.log("keyDates", keyDates, "eventsToInclude", eventsToInclude);
      studies.forEach((s) => {
        const studyData = keyDates.filter((k) => k.study === s)[0];
        eventsToInclude.forEach((e, eid) => {
          // get the figure
          const date =
            studyData && e in studyData ? new Date(studyData[e]) : null;
          // const date = 1696015800000;
          // console.log("s", s, "e", e, "studyData[e]", studyData[e], "eid", eid);
          seriesData.push({
            id: s + e,
            name: s,
            start: date,
            end: date,
            milestone: true,
            parent: studiesInfo[s],
            role: null,
            what: e,
            color:
              colorsForMilestones && eid < colorsForMilestones.length
                ? colorsForMilestones[eid]
                : "gray",
            level: "2a",
            collapsed: globalCollapse,
            // tooltip: {
            //   headerFormat:
            //     '<span style="font-size: 1.8em">{series.name}</span><br/>',
            // },
          });
        });
      });
    }
    // console.log(
    //   "keyDates",
    //   keyDates,
    //   "seriesData",
    //   seriesData,
    //   window,
    //   screenHeight
    // );

    //add holidays to person gantt
    if (type === "person") {
      const holidays = userHolidays.holiday_periods,
        allPeople = holidays.map((h) => h.name),
        uniquePeople = [...new Set(allPeople)];
      // make sure there is a line for each person
      uniquePeople.forEach((p, pid) => {
        const dataExists = seriesData.filter(
          (sd) => sd.name.toUpperCase() === p.toUpperCase()
        );
        if (dataExists.length === 0) {
          seriesData.push({
            id: p,
            name: p,
            start: Number(new Date()),
            end: Number(new Date()),
            milestone: false,
            parent: null,
            role: null,
            what: null,
            level: "1",
            collapsed: globalCollapse,
            // color: "gray",
            // tooltip: {
            //   headerFormat:
            //     '<span style="font-size: 1.8em">{series.name}</span><br/>',
            // },
          });
        }
      });

      // add everyone's holidays
      holidays.forEach((h, hid) => {
        const start_range = new Date(h.start_range),
          end_range = new Date(h.end_range);
        seriesData.push({
          id: "holiday" + hid,
          name: "Holiday(s)",
          start: Number(start_range),
          end: Number(end_range),
          milestone: false,
          parent: h.name,
          role: "H",
          what: null,
          level: "2a",
          collapsed: globalCollapse,
          // color: "gray",
          // tooltip: {
          //   headerFormat:
          //     '<span style="font-size: 1.8em">{series.name}</span><br/>',
          // },
        });
      });
    }

    // sort the data into a suitable sequence
    // seriesData.sort((a, b) => a.level - b.level || a.id < b.id);
    seriesData.sort((a, b) => {
      const key1 = a.level + a.name,
        key2 = b.level + b.name;
      if (key1 > key2) return 1;
      else if (key1 < key2) return -1;
      else return 0;
    });
    // console.log("sorted seriesData", seriesData);

    // define gantt chart settings
    const tempChart = {
      chart: {
        height: scrollable ? undefined : screenHeight - topMargin,
        // width: screenWidth * 0.8,
        zooming: { type: "xy" },
        scrollablePlotArea: scrollable
          ? {
              minHeight: screenHeight - topMargin,
            }
          : undefined,
      },
      title: {
        text:
          type === "person"
            ? "Resource Planning for people"
            : "Resource Planning for studies",
      },
      yAxis: {
        uniqueNames: true,
        // max:3,
        staticScale: 20,
      },
      plotOptions: {
        series: {
          // dataSorting: {
          //   enabled: true,
          //   sortKey: "name",
          // },
          dataLabels: {
            enabled: true,
            format: "{point.role}",
            style: {
              cursor: "default",
              pointerEvents: "none",
            },
          },
          allowPointSelect: true,
          point: {
            events: {
              select: (e) => {
                console.log(e);
              },
              //   unselect: updateRemoveButtonStatus,
              //   remove: updateRemoveButtonStatus
            },
          },
        },
      },
      navigator: {
        enabled: true,
        liveRedraw: true,
        series: {
          type: "gantt",
          pointPlacement: 0.5,
          pointPadding: 0.25,
          accessibility: {
            enabled: false,
          },
        },
        yAxis: {
          min: 0,
          max: 3,
          reversed: true,
          categories: [],
        },
      },
      scrollbar: {
        enabled: true,
      },
      rangeSelector: {
        enabled: true,
        selected: 0,
      },
      accessibility: { enabled: false },
      dataLabels: {
        formatter: function () {
          if (this.point.milestone) {
            var date = new Date(this.point.start);
            return `${this.point.what}<br/>${
              date.getMonth() + 1
            }/${date.getDate()}`;
          }
        },
        inside: false,
        y: -37,
      },
      series: [
        {
          name: "Resource",
          data: seriesData,
          pointPadding: 0,
          groupPadding: 0,
          maxPointWidth: 30,
          // dataLabels: {
          //   formatter: function() {
          //     if (this.point.milestone) {
          //       var date = new Date(this.point.start);
          //       if (this.point.what) {
          //         return `${this.point.what}<br/>${date.getMonth() + 1}/${date.getDate()}`;
          //       } else {
          //         return `${date.getMonth() + 1}/${date.getDate()}`;
          //       }
          //     }
          //   },
          //   inside: false,
          //   y: -37
          // },
        },
      ],
      credits: { enabled: false },
      tooltip: {
        // pointFormat:
        //   '<span style="font-weight: bold">{point.name}</span><br>' +
        //   "{point.start:%e %b}" +
        //   "{#unless point.milestone} → {point.end:%e %b}{/unless}" +
        //   "<br>" +
        //   "Role: {#if point.role}{point.role}{else}unassigned{/if}",
        headerFormat:
          '<span style="font-weight:bold;font-size: 14px">{point.yCategory}</span><br/>',
        pointFormatter: function () {
          let point = this,
            format = "%e. %b",
            options = point.options,
            lines,
            fromTo = dateFormat(format, point.start);
          if (!options.milestone)
            fromTo = fromTo + " → " + dateFormat(format, point.end);
          // console.log("point", point, "options", options);

          lines = [
            // {
            //   value: point.name,
            //   style: "font-weight: bold;",
            // },
            {
              value: fromTo,
            },
          ];
          if (point.milestone) {
            lines.push({
              title: "What",
              value: point.what,
            });
          } else if (point.role) {
            lines.push({
              title: "Role",
              value: point.role,
            });
          }
          // if (point.milestone)
          //   return '<span style="font-size: 1.8em">xxx{series.name}</span><br/>';
          // else
          return lines.reduce(function (str, line) {
            var s = "",
              style = defined(line.style) ? line.style : "font-size: 0.8em;";
            if (line.visible !== false) {
              s =
                '<span style="' +
                style +
                '">' +
                (defined(line.title) ? "<b>" + line.title + "</b> → " : "") +
                (defined(line.value) ? line.value : "") +
                "</span><br/>";
            }
            return str + s;
          }, "");
        },
      },
    };
    console.log("tempChart", tempChart);
    setChart(tempChart);
    // eslint-disable-next-line
  }, [
    info,
    keyDates,
    studiesInfo,
    userHolidays,
    rolesLongShort,
    eventsToInclude,
    colorsForMilestones,
    globalCollapse,
  ]);

  return (
    <Box>
      {["person", "study"].includes(type) && type !== undefined ? (
        <Box sx={{ position: "fixed", top: 40, left: 20, zIndex: 100 }}>
          <Tooltip title="Information about this screen">
            <Button
              color="info"
              startIcon={<Info />}
              onClick={() => {
                setOpenInfo(true);
              }}
            >
              Info
            </Button>
          </Tooltip>
          <Tooltip title="Toggle chart scrolling">
            <Checkbox
              color={"success"}
              checked={scrollable}
              onChange={() => {
                setScrollable(!scrollable);
              }}
            />
          </Tooltip>
          <Tooltip title="Toggle collapse everything">
            <Checkbox
              checked={globalCollapse}
              color={"warning"}
              onChange={() => {
                setGlobalCollapse(!globalCollapse);
              }}
            />
          </Tooltip>
        </Box>
      ) : null}
      {chart ? (
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={"ganttChart"}
          options={chart}
        />
      ) : null}

      {/* Dialog with General info about this screen */}
      <Dialog fullWidth onClose={() => setOpenInfo(false)} open={openInfo}>
        <DialogTitle>Info about this screen</DialogTitle>
        <DialogContent>
          <p>Color key for milestones</p>
          {colorsForMilestones &&
            eventsToInclude &&
            colorsForMilestones.map((color, colorIndex) => (
              <ul key={colorIndex} style={{ color: color }}>
                {color} = {eventsToInclude[colorIndex]}
              </ul>
            ))}
          <p>Data sources</p>
          <ul>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/assignments.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  assignments.json
                </a>
              </b>{" "}
              has a list of all resources assigned to roles in studies, which is
              manually created with this app
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/key_dates.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  key_dates.json
                </a>
              </b>{" "}
              has a list of all key dates for a study, which is edited by the
              user but based on an initial running of{" "}
              <a
                href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/default_key_dates.sas"
                target="_blank"
                rel="noreferrer"
              >
                default_key_dates.sas
              </a>
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/studies_info.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  studies_info.json
                </a>
              </b>{" "}
              has a list of all studies with their corresponding
              compounds/products and indications, which is created by the
              running of{" "}
              <a
                href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/studies_info.sas"
                target="_blank"
                rel="noreferrer"
              >
                studies_info.sas
              </a>
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/roles_long_short.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  roles_long_short.json
                </a>
              </b>{" "}
              has a list of all roles with a (shorter) version to use when
              showing in the Gantt chart
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/events_to_include.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  events_to_include.json
                </a>
              </b>{" "}
              has a list of events (variable names) to show as milestones
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/colors_for_milestones.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  colors_for_milestones.json
                </a>
              </b>{" "}
              has a list of colors to use for milestones which correspond to the
              events from events_to_include, so this enables you to choose the
              color to use for each different event/milestone
            </li>
          </ul>{" "}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Gantt;
