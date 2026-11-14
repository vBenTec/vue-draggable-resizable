# Glossary

Domain terms used in the code and in design discussions. Words that are clear from the code
(_element_, _container_, _parent_, _handle_, _constraints_) are not listed.

**Gesture**: One drag or one resize of an element, from pointer-down until the pointer is released
or the gesture is cancelled. An element has at most one gesture at a time.

**Guides**: The coordinates an element can snap to while it is dragged inside a container: custom
guides, the parent's edges and centre, and the edges and centres of the other members. Vertical
guides are x coordinates, horizontal guides are y coordinates.

**Matched guides**: The guides the dragged element is currently aligned with. The container draws
them as lines.

**Member**: An element registered with a container as a snap target. Every element inside a
container is a member, whether or not it can be dragged itself.

**Snap session**: One drag's access to the container's guides. It starts with the drag, publishes
the matched guides on every move and clears them when it ends. Only the most recently started
session can publish.
