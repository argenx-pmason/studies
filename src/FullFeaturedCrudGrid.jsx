import React, { useState, useEffect } from "react";
import { Box, Button, Tooltip } from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  CloudDownload,
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
import localAssignmentsJson from "./samples/assignments.json"; // made manually or using app
import localAllRolesJson from "./samples/all_roles.json"; // created manually
import localAllStudiesJson from "./samples/all_studies.json"; // generated from SAS dataset &_SASWS_\general\biostat\metadata\projects\studies_status
import localAllUsersJson from "./samples/all_users.json"; // created from spreadsheet &_sasws_/general/maintenance/metadata/folder_access_request.xlsx
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
function FullFeaturedCrudGrid(props) {
  // define variables
  const { href } = window.location,
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    [rows, setRows] = useState(null),
    [roles, setRoles] = useState(null),
    [studies, setStudies] = useState(null),
    [users, setUsers] = useState(null),
    // [userids, setUserids] = useState(null),
    webDavPrefix = "https://xarprod.ondemand.sas.com/lsaf/webdav/repo",
    [rowModesModel, setRowModesModel] = useState({}),
    userJsonDir = webDavPrefix + "/general/biostat/metadata/projects/rm";

  // define functions
  const EditToolbar = (props) => {
      const { setRows, setRowModesModel } = props,
        handleAddRow = () => {
          const id = randomId();
          setRows((oldRows) => [
            ...oldRows,
            { id, name: "", userid: "", isNew: true },
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
          if (mode === "local") {
            // TODO: save to local location
          } else updateJsonFile(userJsonDir + "/assignments.json", rows);
          console.log("handleSaveData - ", rows);
        };

      return (
        <GridToolbarContainer>
          <Tooltip title="Assign someone to a role in a study">
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
    columns = [
      {
        field: "study",
        headerName: "Study",
        //   type: "number",
        width: 120,
        align: "left",
        headerAlign: "left",
        editable: true,
        type: "singleSelect",
        valueOptions: studies,
      },
      {
        field: "role",
        headerName: "Role",
        width: 160,
        editable: true,
        type: "singleSelect",
        valueOptions: roles,
      },
      {
        field: "name",
        headerName: "Name",
        width: 170,
        editable: true,
        type: "singleSelect",
        valueOptions: users,
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
                icon={<Save />}
                label="Save"
                sx={{
                  color: "primary.main",
                }}
                onClick={handleSaveClick(id)}
              />,
              <GridActionsCellItem
                icon={<Cancel />}
                label="Cancel"
                className="textPrimary"
                onClick={handleCancelClick(id)}
                color="inherit"
              />,
            ];
          }

          return [
            <GridActionsCellItem
              icon={<Edit />}
              label="Edit"
              className="textPrimary"
              onClick={handleEditClick(id)}
              color="inherit"
            />,
            <GridActionsCellItem
              icon={<Delete />}
              label="Delete"
              onClick={handleDeleteClick(id)}
              color="inherit"
            />,
          ];
        },
      },
    ];

  // load initial files
  useEffect(() => {
    if (mode === "local") {
      setRows(localAssignmentsJson); // sample data for users assigned to studies
      setStudies(localAllStudiesJson.sort()); // sample list of all studies
      setRoles(localAllRolesJson); // sample list of all roles
      setUsers(localAllUsersJson.sort()); // sample list of all users
      //   setUserids(localAllUsersJson.users.map((u) => u.userid).sort());
    } else {
      getJsonFile(userJsonDir + "/assignments.json", setRows); // data for users assigned to studies
      getJsonFile(userJsonDir + "/all_studies.json", setStudies); // List of all studies
      getJsonFile(userJsonDir + "/all_roles.json", setRoles); // List of all roles
      getJsonFile(userJsonDir + "/all_users.json", setUsers); // List of all users
    }
  }, [mode, userJsonDir]);

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
            padding: 1,
          }}
        />
      )}
    </Box>
  );
}
export default FullFeaturedCrudGrid;
