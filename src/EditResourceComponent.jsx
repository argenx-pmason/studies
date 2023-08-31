import { useLayoutEffect, useRef } from "react";
import { useGridApiContext } from "@mui/x-data-grid-pro";
function EditResourceComponent(props) {
  const { id, value, field, hasFocus } = props;
  const apiRef = useGridApiContext();
  const ref = useRef();

  useLayoutEffect(() => {
    if (hasFocus) {
      ref.current.focus();
    }
  }, [hasFocus]);

  const handleValueChange = (event) => {
    const newValue = event.target.value; // The new value entered by the user
    apiRef.current.setEditCellValue({ id, field, value: newValue });
  };

  return (
    <input ref={ref} type="text" value={value} onChange={handleValueChange} />
  );
}

export default EditResourceComponent;
