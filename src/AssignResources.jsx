import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Menu,
  MenuItem,
  // Select,
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
// import EditResourceComponent from "./EditResourceComponent";
import { randomId } from "@mui/x-data-grid-generator";
import { getJsonFile, updateJsonFile } from "./utility";
import localAssignmentsJson from "./samples/assignments.json"; // made manually or using app
import localAllRolesJson from "./samples/all_roles.json"; // created manually
import localAllStudiesJson from "./samples/all_studies.json"; // generated from SAS dataset &_SASWS_\general\biostat\metadata\projects\studies_status
import localAllUsersJson from "./samples/all_users.json"; // created from spreadsheet &_sasws_/general/maintenance/metadata/folder_access_request.xlsx
import localFutureUsersJson from "./samples/future_users.json"; // made manually
import localDeletedUsersJson from "./samples/deleted_users.json"; // made manually
import localStudiesInfoJson from "./samples/studies_info.json"; // made with SAS program
import { LicenseInfo } from "@mui/x-data-grid-pro";
// import Gantt from "./Gantt";
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
function AssignResources(props) {
  // define variables
  const { href } = window.location,
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    [rows, setRows] = useState(null),
    [roles, setRoles] = useState(null),
    [studies, setStudies] = useState(null),
    [studiesInfo, setStudiesInfo] = useState(null),
    [users, setUsers] = useState(null),
    [allUsers, setAllUsers] = useState(null),
    [futureUsers, setFutureUsers] = useState(null),
    [deletedUsers, setDeletedUsers] = useState(null),
    // [userids, setUserids] = useState(null),
    webDavPrefix = "https://xarprod.ondemand.sas.com/lsaf/webdav/repo",
    [rowModesModel, setRowModesModel] = useState({}),
    userJsonDir = webDavPrefix + "/general/biostat/metadata/projects/rm",
    [openInfo, setOpenInfo] = useState(false),
    [anchorEl, setAnchorEl] = useState(null);

  // define functions
  const EditToolbar = (props) => {
      const { setRows, setRowModesModel } = props,
        handleAddRow = () => {
          const id = randomId();
          setRows((oldRows) => [
            ...oldRows,
            { id, name: "", role: "", isNew: true },
          ]);
          setRowModesModel((oldModel) => ({
            ...oldModel,
            [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" },
          }));
        },
        handleLoadData = () => {
          if (mode === "local") setRows(localAssignmentsJson);
          else getJsonFile(userJsonDir + "/assignments.json", setRows);
          console.log(
            "handleLoadData - ",
            "userJsonFile",
            userJsonDir + "/assignments.json",
            "rows",
            rows
          );
        },
        handleSaveData = () => {
          // add product/indication info to record before saving
          const rows2 = rows.map((r) => {
            // TODO: put some failsafe around this in case we dont find a study matching
            return { ...r, prod_ind: studiesInfo[r.study] };
          });
          if (mode === "local") {
            // TODO: save to local location
          } else updateJsonFile(userJsonDir + "/assignments.json", rows2);
          console.log("handleSaveData - ", rows2);
        };

      return (
        <GridToolbarContainer>
          <Tooltip title="Assign someone to a role in a study">
            <Button color="primary" startIcon={<Add />} onClick={handleAddRow}>
              Add
            </Button>
          </Tooltip>
          <Tooltip title="Create rows for all roles in a study">
            <Button
              color="error"
              startIcon={<Add color="error" />}
              onClick={handleClickMenu}
              aria-label="menu2"
              aria-controls={Boolean(anchorEl) ? "View a role" : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? "true" : undefined}
            >
              All
            </Button>
          </Tooltip>
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
    },
    // ResourceComponent = (props) => {
    //   return <p>Name: {props.value}</p>;
    // },
    // EditResourceComponent = (props) => {
    //   console.log(props);
    //   return (
    //     <Select
    //       value={props.value}
    //       label="Name"
    //       onChange={setNameFromSelect}
    //     >
    //       <MenuItem value={10}>Ten</MenuItem>
    //       <MenuItem value={20}>Twenty</MenuItem>
    //       <MenuItem value={30}>Thirty</MenuItem>
    //     </Select>
    //   );
    // },
    // setNameFromSelect = (props)=>{
    //   console.log(props)
    // },
    columns = [
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
      {
        field: "role",
        headerName: "Role",
        type: "singleSelect",
        width: 160,
        editable: true,
        valueOptions: roles,
      },
      {
        field: "name",
        headerName: "Name",
        width: 170,
        type: "singleSelect",
        valueOptions: users,
        editable: true,
        // type: "string",
        // renderEditCell: EditResourceComponent,
        // renderCell: ResourceComponent,
      },
      {
        field: "from",
        headerName: "From",
        type: "date",
        width: 80,
        editable: true,
        valueGetter: (params) => {
          return new Date(params.value);
        },
      },
      {
        field: "to",
        headerName: "To",
        type: "date",
        width: 80,
        editable: true,
        valueGetter: (params) => {
          return new Date(params.value);
        },
      },
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
    ],
    handleClickMenu = (event) => {
      setAnchorEl(event.currentTarget);
    },
    handleCloseMenu = () => {
      setAnchorEl(null);
    },
    // add a row for each role for a particular study
    handleAddAllRows = (s) => {
      const tempRows = [];
      roles.forEach((role) => {
        const id = randomId();
        tempRows.push({
          id,
          study: s,
          role: role,
          from: "",
          to: "",
          isNew: true,
        });
      });
      setRows([...rows, ...tempRows]);
    };

  // load initial files
  useEffect(() => {
    if (mode === "local") {
      console.log("loading local files");
      setRows(localAssignmentsJson); // sample data for users assigned to studies
      setStudiesInfo(localStudiesInfoJson); // sample data for studies info mapping indications to studies
      setStudies(localAllStudiesJson.sort()); // sample list of all studies
      setRoles(localAllRolesJson); // sample list of all roles
      setAllUsers(localAllUsersJson.sort()); // sample list of all users
      setFutureUsers(localFutureUsersJson.sort()); // sample list of future users
      setDeletedUsers(localDeletedUsersJson.sort()); // sample list of deleted users
    } else {
      console.log("loading remote files from " + userJsonDir);
      getJsonFile(userJsonDir + "/assignments.json", setRows); // data for users assigned to studies
      getJsonFile(userJsonDir + "/studies_info.json", setStudiesInfo); // data for users assigned to studies
      getJsonFile(userJsonDir + "/all_studies.json", setStudies); // List of all studies
      getJsonFile(userJsonDir + "/all_roles.json", setRoles); // List of all roles
      getJsonFile(userJsonDir + "/all_users.json", setAllUsers); // List of all users
      getJsonFile(userJsonDir + "/future_users.json", setFutureUsers); // List of future users
      getJsonFile(userJsonDir + "/deleted_users.json", setDeletedUsers); // List of deleted users
    }
    // eslint-disable-next-line
  }, [mode, userJsonDir]);

  // make list of users with all users, adding future users and then removing deleted users
  useEffect(() => {
    if (allUsers === null || futureUsers === null || deletedUsers === null)
      return;
    const tempUsers = [...allUsers, ...futureUsers].filter(
      (u) => !deletedUsers.includes(u)
    );
    setUsers(tempUsers.sort()); // list of all users with futures added and deleted removed
  }, [allUsers, futureUsers, deletedUsers]);

  return (
    <Box
      sx={{
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
          autoHeight={true}
          rowHeight={30}
          editMode="row"
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

      {studies && (
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
      )}

      {/* Gantt chart */}
      {/* <Gantt info={rows} /> */}

      {/* Dialog with General info about this screen */}
      <Dialog fullWidth onClose={() => setOpenInfo(false)} open={openInfo}>
        <DialogTitle>Info about this screen</DialogTitle>
        <DialogContent>
          <ul>
            <li>
              <b>ADD</b> will add a row to the table, ready to be edited. Edited
              rows are not saved to server until SAVE DATA is pressed.
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
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/studies_info.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  studies_info.json
                </a>
              </b>{" "}
              has a list of info about each study taken from the{" "}
              <b>studies_info</b> SAS dataset located in{" "}
              <b>/general/biostat/metadata/projects</b> and by running the
              lsaf_getchildren macro to get product/compounds, which is created
              by{" "}
              <a
                href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/all_studies.sas"
                target="_blank"
                rel="noreferrer"
              >
                studies_info.sas
              </a>
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/future_users.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  future_users.json
                </a>
              </b>{" "}
              has a list of future users not yet in the LSAF system, which is
              edited manually
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/deleted_users.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  deleted_users.json
                </a>
              </b>{" "}
              has a list of users that were part of LSAF but who we want
              removed, which is edited manually
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/all_users.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  all_users.json
                </a>
              </b>{" "}
              has a list of all users taken from{" "}
              <b>/general/maintenance/metadata/folder_access_request.xlsx</b>,
              which is created by{" "}
              <a
                href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/all_users.sas"
                target="_blank"
                rel="noreferrer"
              >
                all_users.sas
              </a>
            </li>
            <li>
              <b>
                <a
                  href="https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file=https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/metadata/projects/rm/all_roles.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  all_roles.json
                </a>
              </b>{" "}
              has a list of all roles, which is manually created
            </li>
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
          </ul>{" "}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
export default AssignResources;
