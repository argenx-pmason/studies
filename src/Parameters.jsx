import React, { useState, useEffect } from "react";
import {
  Box,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import Select from "react-select";
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
  DataGridPro,
  GridRowModes,
  GridToolbarContainer,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridToolbarExport,
} from "@mui/x-data-grid-pro";
import { randomId } from "@mui/x-data-grid-generator";
import { getJsonFile, updateJsonFile } from "./utility";
import localAllEventsJson from "./samples/all_events.json";
import localAllIndicationsJson from "./samples/all_indications.json"; // generated from SAS dataset &_SASWS_\general\biostat\metadata\projects\rm\all_indications
import localAllRolesJson from "./samples/all_roles.json";
import localAllStudiesJson from "./samples/all_studies.json";
import localAllUsersJson from "./samples/all_users.json";
import localColorsForMilestonesJson from "./samples/colors_for_milestones.json"; // made manually
import localEventsToIncludeJson from "./samples/events_to_include.json"; // made manually

function Parameters(props) {
  const { href } = window.location,
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    webDavPrefix = "https://xarprod.ondemand.sas.com/lsaf/webdav/repo",
    userJsonDir = webDavPrefix + "/general/biostat/metadata/projects/rm",
    fileOptions = [
      { value: "allEvents", label: "All events", filename: "all_events.json" },
      {
        value: "allIndications",
        label: "All indications",
        filename: "all_indications.json",
      },
      { value: "allRoles", label: "All roles", filename: "all_roles.json" },
      {
        value: "allStudies",
        label: "All Studies",
        filename: "all_studies.json",
      },
      { value: "allUsers", label: "All users", filename: "all_users.json" },
      {
        value: "colorsForMilestones",
        label: "Colors for milestones",
        filename: "colors_for_milestones.json",
      },
      {
        value: "eventsToInclude",
        label: "Events to include",
        filename: "events_to_include.json",
      },
    ],
    [filename, setFilename] = useState(null),
    // eslint-disable-next-line
    [allEvents, setAllEvents] = useState(null),
    // eslint-disable-next-line
    [allIndications, setAllIndications] = useState(null),
    // eslint-disable-next-line
    [allRoles, setAllRoles] = useState(null),
    // eslint-disable-next-line
    [allStudies, setAllStudies] = useState(null),
    // eslint-disable-next-line
    [allUsers, setAllUsers] = useState(null),
    // eslint-disable-next-line
    [colorsForMilestones, setColorsForMilestones] = useState(null),
    // eslint-disable-next-line
    [eventsToInclude, setEventsToInclude] = useState(null),
    [currentFile, setCurrentFile] = useState(null),
    [rowModesModel, setRowModesModel] = useState({}),
    [openInfo, setOpenInfo] = useState(false),
    [rows, setRows] = useState(null),
    [columns, setColumns] = useState(null);

  // define functions
  const selectJsonFile = (e) => {
      //   console.log("e", e, "fileOptions", fileOptions);
      setCurrentFile(e);
      setRowModesModel({});
    },
    EditToolbar = (props) => {
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
          if (mode === "local") resetRowsColumns();
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
          <Tooltip title="Add a row">
            <Button color="primary" startIcon={<Add />} onClick={handleAddRow}>
              Add
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
    handleEditClick = (id) => () => {
      const temp = {
        ...rowModesModel,
        [id]: { mode: GridRowModes.Edit, fieldToFocus: "variable" },
      };
      console.log(
        "handleEditClick - ",
        id,
        "rowModesModel before",
        rowModesModel,
        "rowModesModel about to be set",
        temp
      );
      setRowModesModel(temp);
      //   resetRowsColumns()
    },
    handleDeleteClick = (id) => () => {
      setRows(rows.filter((row) => row.id !== id));
    },
    handleSaveClick = (id) => () => {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
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
    handleRowEditStop = (params, event) => {
      if (params.reason === GridRowEditStopReasons.rowFocusOut) {
        event.defaultMuiPrevented = true;
      }
    },
    processRowUpdate = (newRow) => {
      const updatedRow = { ...newRow, isNew: false };
      setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
      return updatedRow;
    },
    handleRowModesModelChange = (newRowModesModel) => {
      console.log("newRowModesModel", newRowModesModel);
      setRowModesModel(newRowModesModel);
    },
    resetRowsColumns = () => {
      // eslint-disable-next-line
      const rows0 = eval(currentFile.value).map((row, id) => {
        return { id: id, variable: row };
      });
      setRows(rows0);
      setColumns([
        {
          field: "variable",
          headerName: "Value",
          width: 400,
          type: "string",
          editable: true,
        },
        {
          field: "actions",
          type: "actions",
          headerName: "Actions",
          width: 100,
          cellClassName: "actions",
          getActions: ({ id }) => {
            const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
            console.log(
              id,
              "isInEditMode",
              isInEditMode,
              "rowModesModel",
              rowModesModel
            );
            // const isInEditMode =
            //   rowModesModel[id]?.mode === "edit" ||
            //   rowModesModel[id]?.mode === GridRowModes.Edit;

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
                onClick={handleDeleteClick(id, setRows)}
                color="inherit"
              />,
            ];
          },
        },
      ]);
    };

  console.log("rows", rows, "columns", columns, "rowModesModel", rowModesModel);

  // load initial files
  useEffect(() => {
    if (mode === "local") {
      setAllEvents(localAllEventsJson); // sample data for list of all events
      setAllIndications(localAllIndicationsJson);
      setAllRoles(localAllRolesJson);
      setAllStudies(localAllStudiesJson);
      setAllUsers(localAllUsersJson); // sample data for list of all users
      setColorsForMilestones(localColorsForMilestonesJson);
      setEventsToInclude(localEventsToIncludeJson);
    } else {
      getJsonFile(userJsonDir + "/all_events", setAllEvents); // data for all events
      getJsonFile(userJsonDir + "/all_indications", setAllIndications);
      getJsonFile(userJsonDir + "/all_roles", setAllRoles);
      getJsonFile(userJsonDir + "/all_all_studies", setAllStudies);
      getJsonFile(userJsonDir + "/all_users", setAllUsers); // data for all users
      getJsonFile(
        userJsonDir + "/colors_for_milestones",
        setColorsForMilestones
      );
      getJsonFile(userJsonDir + "/events_to_include", setEventsToInclude);
    }
  }, [mode, userJsonDir, currentFile]);

  // choosing a different file means we reset the rows and columns
  useEffect(() => {
    if (currentFile === null || !("value" in currentFile)) return;
    resetRowsColumns();
    // get the actual filename to read if we use the load data or save data buttons
    const f = fileOptions.filter((fo) => fo.value === currentFile.value),
      tempFilename = f[0].filename;
    // console.log(
    //   "tempFilename",
    //   tempFilename,
    //   "currentFile",
    //   currentFile,
    //   "fileOptions",
    //   fileOptions
    // );
    setFilename(tempFilename);
    // eslint-disable-next-line
  }, [currentFile]);

  //   console.log("rows", rows, "columns", columns);

  return (
    <Box>
      {fileOptions && (
        <Select
          options={fileOptions}
          placeholder="Select a JSON file to view/edit"
          value={currentFile}
          onChange={selectJsonFile}
          //   menuIsOpen={true}
          maxMenuHeight={300}
        />
      )}

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

      {/* Dialog with General info about this screen */}
      <Dialog fullWidth onClose={() => setOpenInfo(false)} open={openInfo}>
        <DialogTitle>Info about this screen</DialogTitle>
        <DialogContent>
          <ul>
            <li>This screen is still under development and the editing does not fully work yet.</li>
            <li>The main purpose of this screen at present is to view the JSON files used to drive the system.</li>
          </ul>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
export default Parameters;
