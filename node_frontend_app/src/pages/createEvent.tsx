export default function CreateEvent() {
    return (
        <div>
            <h1>Create Event</h1>


            <form>
                <input type="text" placeholder="Event Name" />
                <input type="text" placeholder="Event Date" />
                <input type="text" placeholder="Event Time" />
                <input type="text" placeholder="Event Location" />
                <input type="text" placeholder="Event Price" />
                <input type="text" placeholder="Event Category" />
                <button type="submit">Create Event</button>
            </form>
        </div>
    );
}