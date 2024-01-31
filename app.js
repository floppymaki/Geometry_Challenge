document.addEventListener("DOMContentLoaded", function () {
    // Target the container where the exercise list will be displayed
    const exerciseList = document.getElementById("exercise-list");

    // Fetch the exercises from the JSON Server API
    fetch('http://localhost:3000/exercises')
        .then(response => response.json())
        .then(exercises => {
            // Sort exercises in descending order based on ID
            exercises.sort((a, b) => b.id - a.id);

            // Generate HTML for the exercise list
            const exerciseListHTML = generateExerciseListHTML(exercises);

            // Update the container with the generated HTML
            exerciseList.innerHTML = exerciseListHTML;
        })
        .catch(error => console.error('Error fetching exercises:', error));

    // Function to generate HTML for the exercise list
    function generateExerciseListHTML(exercises) {
        if (!exercises || exercises.length === 0) {
            return '<p>No exercises available.</p>';
        }

        const tableRows = exercises.map(exercise => `
        <tr>
            <th scope="row">${exercise.id}</th>
            <td><a href="exercise.html?id=${exercise.id}&option=0">${exercise.title}</a></td>
            <td>
                <div class="btn-group" role="group">
                    <a href="/create.html?id=${exercise.id}" class="btn btn-warning btn-edit">
                        <i class="bi bi-pencil-square"></i>
                    </a>

                    <button type="button" class="btn btn-danger btn-delete" data-id="${exercise.id}" onclick="deleteExercise(this)"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    return `${tableRows}`;
    }


});

function deleteExercise(btn){
    let id = btn.getAttribute('data-id');

    fetch(`http://localhost:3000/exercises/${id}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // console.log('Exercise deleted successfully');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}