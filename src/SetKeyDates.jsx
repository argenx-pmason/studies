import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Grid,
  // Menu,
  // MenuItem,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  CloudDownload,
  Info,
} from "@mui/icons-material";
import {
  GridRowModes,
  DataGridPro,
  GridToolbarContainer,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridToolbarExport,
} from "@mui/x-data-grid-pro";
import { randomId } from "@mui/x-data-grid-generator";
import { getJsonFile, updateJsonFile } from "./utility";
import localKeyDatesJson from "./samples/key_dates.json"; // made manually or using app
import localAllEventsJson from "./samples/all_events.json"; // created manually
import localStudiesStatusJson from "./samples/studies_status.json"; // generated from SAS dataset &_SASWS_\general\biostat\metadata\projects\rm\studies_status
import localAllStudiesJson from "./samples/all_studies.json"; // generated from SAS dataset &_SASWS_\general\biostat\metadata\projects\rm\all_studies
import localAllIndicationsJson from "./samples/all_indications.json"; // generated from SAS dataset &_SASWS_\general\biostat\metadata\projects\rm\all_indications
import localUserMessagesJson from "./samples/user_messages.json"; // generated by SAS program to check for existence of files, etc.
import localWhatsNewJson from "./samples/whats_new.json";
import { LicenseInfo } from "@mui/x-data-grid-pro";
// apply the license for data grid
LicenseInfo.setLicenseKey(
  "369a1eb75b405178b0ae6c2b51263cacTz03MTMzMCxFPTE3MjE3NDE5NDcwMDAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI="
);

/**
 * Renders a data grid with CRUD (Create, Read, Update, Delete) functionality.
 *
 * @param {object} props - The props object.
 * @returns {JSX.Element} The rendered data grid component.
 */
function SetKeyDates(props) {
  // define variables
  const { href } = window.location,
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    [rows, setRows] = useState(null),
    // [events, setEvents] = useState(null),
    [studies, setStudies] = useState(null),
    [studiesStatus, setStudiesStatus] = useState(null),
    [userMessages, setUserMessages] = useState(null),
    [whatsNew, setWhatsNew] = useState(null),
    [messages, setMessages] = useState(null),
    [indications, setIndications] = useState(null),
    [openSnackbar, setOpenSnackbar] = useState(false),
    [done, setDone] = useState(false),
    [showInfo, setShowInfo] = useState(false),
    [selectedStudy, setSelectedStudy] = useState(null),
    handleCloseSnackbar = (event, reason) => {
      if (reason === "clickaway") {
        return;
      }
      setOpenSnackbar(false);
    },
    webDavPrefix = "https://xarprod.ondemand.sas.com/lsaf/webdav/repo",
    [rowModesModel, setRowModesModel] = useState({}),
    userJsonDir = webDavPrefix + "/general/biostat/metadata/projects/rm",
    [openInfo, setOpenInfo] = useState(false),
    filename = "key_dates.json",
    // [anchorEl, setAnchorEl] = useState(null),
    dates = localAllEventsJson.map((e) => {
      return {
        field: e,
        headerName: e,
        type: "date",
        width: 80,
        editable: [
          "ae_refresh",
          "adsl_refresh",
          "first_ICF",
          "EOS",
          "LstCnd",
          "FPFV",
          "LPLV",
        ].includes(e)
          ? false
          : true,
        valueGetter: (params) => {
          return new Date(params.value);
        },
      };
    }),
    columns = [
      {
        field: "indication",
        headerName: "Indication",
        type: "singleSelect",
        width: 80,
        align: "left",
        headerAlign: "left",
        editable: true,
        valueOptions: indications,
      },
      {
        field: "study",
        headerName: "Study",
        type: "singleSelect",
        width: 120,
        align: "left",
        headerAlign: "left",
        editable: true,
        valueOptions: studies,
      },
      // {
      //   field: "studycat",
      //   headerName: "category",
      //   width: 90,
      //   align: "left",
      //   headerAlign: "left",
      //   editable: false,
      // },
      {
        field: "status",
        headerName: "status",
        width: 70,
        align: "left",
        headerAlign: "left",
        editable: false,
        renderCell: (cellValues) => {
          const { value, row } = cellValues,
            { diffs } = row;
          return diffs && diffs.length > 0 ? (
            <Tooltip
              title={
                diffs.includes("D")
                  ? "*Changed Protocol description*"
                  : "" + diffs.includes("S")
                  ? "*Changed Status*"
                  : "" + diffs.includes("Y")
                  ? "*Changed Year*"
                  : ""
              }
            >
              <Box
                sx={{ backgroundColor: "yellow", flex: 1 }}
                onClick={() => {
                  setSelectedStudy(row.study);
                  setShowInfo(true);
                }}
              >
                {value}
              </Box>
            </Tooltip>
          ) : (
            value
          );
        },
      },
      {
        field: "subjects",
        headerName: "N",
        width: 30,
        align: "left",
        headerAlign: "left",
        editable: false,
      },
      ...dates,
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

          if (isInEditMode) {
            return [
              <GridActionsCellItem
                icon={<Save color="success" />}
                label="Save"
                sx={{
                  color: "primary.main",
                }}
                onClick={handleSaveClick(id)}
              />,
              <GridActionsCellItem
                icon={<Cancel color="error" />}
                label="Cancel"
                className="textPrimary"
                onClick={handleCancelClick(id)}
                color="inherit"
              />,
            ];
          }

          return [
            <GridActionsCellItem
              icon={<Edit color="warning" />}
              label="Edit"
              className="textPrimary"
              onClick={handleEditClick(id)}
              color="inherit"
            />,
            <GridActionsCellItem
              icon={<Delete color="error" />}
              label="Delete"
              onClick={handleDeleteClick(id)}
              color="inherit"
            />,
          ];
        },
      },
    ];

  // define functions
  const EditToolbar = (props) => {
      const { setRows, setRowModesModel } = props,
        handleAddRow = () => {
          const id = randomId();
          setRows((oldRows) => [
            ...oldRows,
            { id, study: "", event: "", isNew: true },
          ]);
          setRowModesModel((oldModel) => ({
            ...oldModel,
            [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
          }));
        },
        handleLoadData = () => {
          if (mode === "local") setRows(localKeyDatesJson);
          else getJsonFile(userJsonDir + "/" + filename, setRows);
          console.log(
            "handleLoadData - ",
            "userJsonFile",
            userJsonDir + "/" + filename,
            "rows",
            rows
          );
        },
        handleSaveData = () => {
          if (mode === "local") {
            // TODO: save to local location
          } else updateJsonFile(userJsonDir + "/" + filename, rows);
          console.log("handleSaveData - ", rows);
        };

      return (
        <GridToolbarContainer>
          <Tooltip title="Set key dates for a study">
            <Button color="primary" startIcon={<Add />} onClick={handleAddRow}>
              One
            </Button>
          </Tooltip>
          {/* <Tooltip title="Create rows for all key dates in a study">
            <Button
              color="error"
              startIcon={<Add color="error" />}
              onClick={handleClickMenu}
              aria-label="menu2"
              aria-controls={Boolean(anchorEl) ? "View a person" : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? "true" : undefined}
            >
              All
            </Button>
          </Tooltip> */}
          <Tooltip title="Load data from server">
            <Button
              color="primary"
              startIcon={<CloudDownload />}
              onClick={handleLoadData}
            >
              Load Data
            </Button>
          </Tooltip>
          <Tooltip title="Save data to server">
            <Button
              color="primary"
              startIcon={<Save />}
              onClick={handleSaveData}
            >
              Save Data
            </Button>
          </Tooltip>
          <Tooltip title="Export selected rows to CSV">
            <GridToolbarExport />
          </Tooltip>
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
        </GridToolbarContainer>
      );
    },
    handleRowEditStop = (params, event) => {
      if (params.reason === GridRowEditStopReasons.rowFocusOut) {
        event.defaultMuiPrevented = true;
      }
    },
    handleEditClick = (id) => () => {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    },
    handleSaveClick = (id) => () => {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    },
    handleDeleteClick = (id) => () => {
      setRows(rows.filter((row) => row.id !== id));
    },
    handleCancelClick = (id) => () => {
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      });

      const editedRow = rows.find((row) => row.id === id);
      if (editedRow.isNew) {
        setRows(rows.filter((row) => row.id !== id));
      }
    },
    processRowUpdate = (newRow) => {
      const updatedRow = { ...newRow, isNew: false };
      setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
      return updatedRow;
    },
    handleRowModesModelChange = (newRowModesModel) => {
      setRowModesModel(newRowModesModel);
    };
  // // add a row for each event for a particular study
  // handleAddAllRows = (s) => {
  //   const tempRows = [];
  //   events.forEach((event) => {
  //     const id = randomId();
  //     tempRows.push({ id, study: s, event: event, date: "", isNew: true });
  //   });
  //   setRows([...rows, ...tempRows]);
  // },
  // handleClickMenu = (event) => {
  //   setAnchorEl(event.currentTarget);
  // },
  // handleCloseMenu = () => {
  //   setAnchorEl(null);
  // };

  // load initial files
  useEffect(() => {
    if (mode === "local") {
      setRows(localKeyDatesJson); // sample data for dates set for studies
      setStudies(localAllStudiesJson.sort()); // sample list of all studies
      setStudiesStatus(localStudiesStatusJson); // sample studies_status dataset with studycat
      setIndications(localAllIndicationsJson); // sample list of all indications
      setUserMessages(localUserMessagesJson); // sample list of user messages
      setWhatsNew(localWhatsNewJson);
    } else {
      getJsonFile(userJsonDir + "/" + filename, setRows); // data for users assigned to studies
      getJsonFile(userJsonDir + "/all_studies.json", setStudies); // List of all studies
      getJsonFile(userJsonDir + "/studies_status.json", setStudiesStatus); // studies_status dataset with studycat
      getJsonFile(userJsonDir + "/all_indications.json", setIndications); // List of all indications
      getJsonFile(userJsonDir + "/user_messages.json", setUserMessages); // List of user messages
      getJsonFile(userJsonDir + "/whats_new.json", setWhatsNew); // list of things that are new in the latest spreadsheet compared to the previous one
    }
  }, [mode, userJsonDir]);

  // add data from whatsNew to rows
  useEffect(() => {
    // console.log(whatsNew, rows, done);
    if (whatsNew === null || rows === null || done) return;
    const tempRows = rows.map((r) => {
      const w = whatsNew.filter((w) => w.study === r.study);
      if (w.length > 0)
        return {
          ...r,
          diffs: w[0].diffs,
          previous: w[0].previous,
          latest: w[0].latest,
          desc: w[0].desc,
          new_desc: w[0].new_desc,
          status: w[0].status,
          new_status: w[0].new_status,
          year: w[0].year,
          new_year: w[0].new_year,
        };
      else return r;
    });
    // console.log("tempRows", tempRows);
    setDone(true);
    // seemed to be a timing problem with setting rows, so added a timeout
    setTimeout(() => {
      setRows(tempRows);
    }, 1000);
  }, [whatsNew, rows, done]);

  // console.log("rows", rows);

  // merge info from studiesStatus with rows in order to get the study category (e.g. individual/pooling)
  useEffect(() => {
    if (rows === null || studiesStatus === null) return;
    const tempRows = rows.map((r) => {
      const sc = studiesStatus.filter(
          (ss) => ss.STUDY.toUpperCase() === r.study.toUpperCase()
        ),
        studycat = sc.length > 0 ? sc[0].studycat : null;
      console.log("studycat", studycat);
      return { ...r, studycat: studycat };
    });
    setRows(tempRows);
    // eslint-disable-next-line
  }, [studiesStatus]);

  useEffect(() => {
    if (userMessages === null) return;
    setOpenSnackbar(true);
    setMessages(userMessages["user_messages"].map((u) => u.message).join("\n"));
  }, [userMessages]);

  return (
    <Box
      sx={{
        mt: 6,
        height: 500,
        width: "100%",
        "& .actions": {
          color: "text.secondary",
        },
        "& .textPrimary": {
          color: "text.primary",
        },
      }}
    >
      {rows && (
        <DataGridPro
          rows={rows}
          columns={columns}
          density="compact"
          editMode="row"
          autoHeight={true}
          rowHeight={30}
          rowModesModel={rowModesModel}
          onRowModesModelChange={handleRowModesModelChange}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          slots={{
            toolbar: EditToolbar,
          }}
          slotProps={{
            toolbar: { setRows, setRowModesModel },
          }}
          sx={{
            // height: windowDimension.winHeight - topMargin,
            fontFamily: "system-ui;",
            fontWeight: "fontSize=5",
            fontSize: "0.7em",
            padding: 0.1,
          }}
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
          }
        />
      )}

      {/* {studies && (
        <Menu
          anchorEl={anchorEl}
          id="account-menu2"
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          onClick={handleCloseMenu}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          {studies.map((s, id) => (
            <MenuItem key={"menuItem2-" + id} onClick={handleCloseMenu}>
              <Box
                onClick={() => {
                  handleAddAllRows(s);
                }}
              >
                {s}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      )} */}

      {/* {userMessages && userMessages['user_messages'].length > 0 && openSnackbar
        ? userMessages['user_messages'].map((m) => (
            <Snackbar
              open={openSnackbar}
              autoHideDuration={10000}
              onClose={handleCloseSnackbar}
              message={m.message}
              // action={action}
            />
          ))
        : null} */}
      {messages && messages.length > 1 && (
        <Snackbar
          open={openSnackbar}
          autoHideDuration={10000}
          onClose={handleCloseSnackbar}
          message={messages}
          // action={action}
        />
      )}

      <Dialog fullWidth onClose={() => setShowInfo(false)} open={showInfo}>
        <DialogTitle>Info about {selectedStudy}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {rows &&
              rows.filter((r) => r.study === selectedStudy).length > 0 && (
                <Grid item xs={6}>
                  <b>Previous</b>
                  <hr />
                  <Box sx={{ mb: 2 }}>
                    <b>Status: </b>
                    {rows.filter((r) => r.study === selectedStudy)[0].status}
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <b>Year: </b>
                    {rows.filter((r) => r.study === selectedStudy)[0].year}
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <b>Description: </b>
                    {rows.filter((r) => r.study === selectedStudy)[0].desc}
                  </Box>
                </Grid>
              )}
            {rows &&
              rows.filter((r) => r.study === selectedStudy).length > 0 && (
                <Grid item xs={6}>
                  <b>Current</b>
                  <hr />
                  <Box
                    sx={{
                      mb: 2,
                      backgroundColor: rows
                        .filter((r) => r.study === selectedStudy)[0]
                        .diffs.includes("S")
                        ? "yellow"
                        : "white",
                    }}
                  >
                    <b>Status: </b>
                    {
                      rows.filter((r) => r.study === selectedStudy)[0]
                        .new_status
                    }
                  </Box>
                  <Box
                    sx={{
                      mb: 2,
                      backgroundColor: rows
                        .filter((r) => r.study === selectedStudy)[0]
                        .diffs.includes("Y")
                        ? "yellow"
                        : "white",
                    }}
                  >
                    <b>Year: </b>
                    {rows.filter((r) => r.study === selectedStudy)[0].new_year}
                  </Box>
                  <Box
                    sx={{
                      mb: 2,
                      backgroundColor: rows
                        .filter((r) => r.study === selectedStudy)[0]
                        .diffs.includes("D")
                        ? "yellow"
                        : "white",
                    }}
                  >
                    <b>Description: </b>
                    {rows.filter((r) => r.study === selectedStudy)[0].new_desc}
                  </Box>
                </Grid>
              )}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Dialog with General info about this screen */}
      <Dialog
        fullWidth
        maxWidth="xl"
        onClose={() => setOpenInfo(false)}
        open={openInfo}
      >
        <DialogTitle>Info about this screen</DialogTitle>
        <DialogContent>
          <ul>
            <li>
              <b>ADD</b> will add a row to the table, ready to be edited. Edited
              rows are not saved to server until SAVE DATA is pressed.
            </li>
            <li>
              <b>ALL</b> will prompt for a study and then add a row for each
              event to the table.
            </li>
            <li>
              <b>LOAD DATA</b> will load the latest data from the JSON file on
              server.
            </li>
            <li>
              <b>SAVE DATA</b> will delete the current JSON file on server and
              then save the current data in the table as a new JSON file.
            </li>
            <li>
              <b>EXPORT</b> allows exporting to a CSV (or printing) any selected
              rows from the table. You can select any number of rows. Selecting
              a row and pressing control-A will select all the rows in table.
            </li>
            <li>
              <b>INFO</b> is this screen.
            </li>
          </ul>
          <p>Editing rows</p>
          <ul>
            <li>
              <Edit color="warning" size="small" />
              puts the row into edit mode
            </li>
            <li>
              <Delete color="error" size="small" />
              deletes the row
            </li>
            <li>
              <Save color="success" size="small" />
              saves the row to memory, but it wont be saved to server (yet)
            </li>
            <li>
              <Cancel color="error" size="small" />
              discards changes made to row
            </li>
          </ul>
          <p>Data sources</p>
          <ul>
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
              </a>{" "}
              which sources it's data from the <b>studies_info</b> SAS dataset
              located in <b>/general/biostat/metadata/projects</b>
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/all_indications.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  all_indications.json
                </a>
              </b>{" "}
              has a list of all indications taken from the <b>studies_info</b>{" "}
              SAS dataset located in <b>/general/biostat/metadata/projects</b>,
              which is created by{" "}
              <a
                href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/all_indications.sas"
                target="_blank"
                rel="noreferrer"
              >
                all_indications.sas
              </a>
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/all_studies.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  all_studies.json
                </a>
              </b>{" "}
              has a list of all studies taken from the <b>studies_status</b> SAS
              dataset located in <b>/general/biostat/metadata/projects</b>,
              which is created by{" "}
              <a
                href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/all_studies.sas"
                target="_blank"
                rel="noreferrer"
              >
                all_studies.sas
              </a>
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/studies_status.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  studies_status.json
                </a>
              </b>{" "}
              has a list of info about studies taken from the{" "}
              <b>studies_status</b> SAS dataset located in{" "}
              <b>/general/biostat/metadata/projects</b>, which is created by{" "}
              <a
                href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/all_studies.sas"
                target="_blank"
                rel="noreferrer"
              >
                studies_status.sas
              </a>
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/all_events.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  all_events.json
                </a>
              </b>{" "}
              has a list of all events which match the variable names in the
              data, which is manually created. If we want to add more dates,
              change the sequence of columns or make other alterations then we
              can modify this JSON file.
            </li>{" "}
          </ul>{" "}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
export default SetKeyDates;
