import { IconButton, ListItem, ListItemButton, ListItemText, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Polygon } from "@/types/polygon";
import { usePolygonsContext } from "@/contexts/PolygonsContext";

interface PolygonListItemProps {
  polygon: Polygon;
}

/**
 * Renders a single polygon row, wiring hover/selection interactions with the shared context
 * and exposing a delete affordance.
 */
const PolygonListItem = ({ polygon }: PolygonListItemProps) => {
  const { selectedId, hoveredId, drawingMode, setHoveredId, selectPolygon, deletePolygon, isLoading } = usePolygonsContext();
  const selected = selectedId === polygon.id;
  const isHovered = hoveredId === polygon.id;

  const handleSelect = () => selectPolygon(polygon.id);
  const handleDelete = () => deletePolygon(polygon.id);
  const handleMouseEnter = () => {
    if (drawingMode) return;
    setHoveredId(polygon.id);
  };
  const handleMouseLeave = () => {
    if (drawingMode) return;
    setHoveredId((current) => (current === polygon.id ? null : current));
  };

  return (
    <ListItem
      disablePadding
      className="hover:bg-slate-800/70"
      secondaryAction={
        <Tooltip title="Delete polygon">
          <span>
            <IconButton edge="end" onClick={handleDelete} disabled={isLoading}>
              <DeleteIcon />
            </IconButton>
          </span>
        </Tooltip>
      }
    >
      <ListItemButton
        selected={selected || isHovered}
        onClick={handleSelect}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer"
      >
        <ListItemText primary={polygon.name} />
      </ListItemButton>
    </ListItem>
  );
};

export default PolygonListItem;
