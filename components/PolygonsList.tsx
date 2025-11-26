import { List } from "@mui/material";
import PolygonListItem from "@/components/PolygonListItem";
import Loader from "@/components/Loader";
import EmptyStateList from "@/components/EmptyStateList";
import { usePolygonsContext } from "@/contexts/PolygonsContext";

/**
 * Displays the polygon collection with loading and empty states tied to the polygons context.
 */
const PolygonsList = () => {
  const { polygons, isLoading, isFetching } = usePolygonsContext();
  const showLoader = isLoading || isFetching;
  return (
    <List className="max-h-[40vh] overflow-y-auto lg:max-h-[calc(100vh-220px)]">
      {showLoader ? (
        <Loader />
      ) : (
        <>
          {polygons.map((polygon) => (
            <PolygonListItem key={polygon.id} polygon={polygon} />
          ))}
          {!polygons.length && <EmptyStateList />}
        </>
      )}
    </List>
  );
};

export default PolygonsList;
