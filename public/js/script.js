let removedTask = {};

$(document).on("change", ".checkbox", function () {
  const taskId = $(this).attr("data-task-id");
  console.log(taskId);

  $.ajax({
    method: "POST",
    url: "/updateCompletedStatus",
    data: { taskId: taskId },
    success: function (response) {
      removedTask = response;
      console.log("removedTask:", removedTask);

      $(`[data-task-id="${taskId}"]`).closest(".todo-card").remove();

      const taskCompletedToast = document.getElementById("taskCompletedToast");
      const toastBootstrap =
        bootstrap.Toast.getOrCreateInstance(taskCompletedToast);
      toastBootstrap.show();
    },
    error: function (xhr, status, error) {
      console.error("Error updating completed status:", error);
    },
  });
});

// Undo button click handler
$(document).on("click", ".undo-button", function () {
  // Send a request to the server to update the completed status to false
  $.ajax({
    method: "POST",
    url: "/undoCompletedStatus",
    data: { taskId: removedTask._id },
    success: function (response) {
      console.log("Task completion undone:", response);

      const todoCardHTML = `<div class="card todo-card" style="width: 18rem">
      <div class="card-body todo-card-body">
        <label for="${removedTask._id}">
          <input type="checkbox" class="form-check-input checkbox" data-task-id="${removedTask._id}"/>
          ${removedTask.taskName}
          <br>
          <small class="secondary-text-light" id="todo-description"
              >${removedTask.description}</small
            >
        </label>

        <div class="row row-cols-2 todo-card-footer">
          <div class="col-6 d-flex align-items-end">
            <small class="due-date">
              
              <i class="fa-regular fa-calendar"></i> 
              ${removedTask.dueDateAbsReadable}

            </small>
          </div>
          <div class="col d-flex align-items-end justify-content-end">
            <small class="secondary-text-light"
              >${removedTask.category}</small
            >
          </div>
        </div>
      </div>
    </div>`

    $('#todo-list').append(todoCardHTML);

    },
    error: function (xhr, status, error) {
      console.error("Error undoing task completion:", error);
    },
  });
});
