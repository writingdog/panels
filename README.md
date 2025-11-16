This demo of the Art Show Display / Free Grid Helper takes as its arguments:

* A grid of panels on an cartesian plane
* A list of artists, each with a required number of panels

When run, the application performs the following actions:

1. Goes through the grid to create a map of all free sections on the grid, sorted by length. A section is contiguous if free panels are adjacent or concave.
2. Sorts the artist list by number of required panels, starting with the largest first.
3. Allocates artists to the free space on the map.

Free space is allocated in the following way:

1. The application will try to assign the artists with the largest blocks first
2. If an artist has requested a "wide" panel, then the application will try to find them a contiguous space _with no 90 degree angles_.
3. The application will then try to exactly fill a section. For example, if an artist requests 5 panels, and there is a section with 5 panels, they will be assigned to that section.
4. Remaining artists will fill in the gaps created by the initial allocation stages.
5. All of an artist's panels are implicitly required to be adjacent.

Artists can be manually assigned to panels. If an artist is manually assigned to a panel, this panel is removed from the list of free space and the artist's number of required panels is lowered by the number of panels that have been manually assigned. For example, the administrator can choose to manually assign only 2 of an artist's 6 required panels, and the remaining 4 will be automatically assigned. Note that this is likely to break the adjacency requirement, above (i.e., automatically assigned panels are unlikely to be next to the manually assigned ones for that artist).

In the current setup, there are five classes.

1. The **showMap** class handles the rendering of the grid and the display of the panels.
2. The **panelLogic** class takes the grid layout from the showMap class, calculates adjacencies and section lengths, and assigns artists to panels.
3. The **serializer** class translates the artist list from the text box to a list of artists that need to be allocated and back again.
4. The **panHandler** class is now overloaded. It originally just handled map events for when you are clicking and dragging the zoomed map to pan it, but it now also catches events for when you are clicking and dragging on the map to draw a new grid.
5. The **allocator** class creates the DOM objects for interaction and display. I _believe_ it is the only class that directly interacts with any HTML objects.

In the HTML, there is a div of class “allocator.” This is passed to the allocator object, who uses this as the container to create the UI and map. The showMap, panelLogic, and allocator objects are properties of one another and communicate via this reference.
