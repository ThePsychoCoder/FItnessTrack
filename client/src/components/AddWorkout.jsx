import React, { useState } from "react";
import styled from "styled-components";
import TextInput from "./TextInput";
import Button from "./Button";
import axios from "axios";

// Styled components
const Card = styled.div`
  flex: 1;
  min-width: 280px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.text_primary + 20};
  border-radius: 14px;
  box-shadow: 1px 6px 20px 0px ${({ theme }) => theme.primary + 15};
  display: flex;
  flex-direction: column;
  gap: 6px;

  @media (max-width: 600px) {
    padding: 16px;
  }
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: ${({ theme }) => theme.primary};

  @media (max-width: 600px) {
    font-size: 14px;
  }
`;

const Message = styled.div`
  font-size: 14px;
  color: ${({ success, theme }) => (success ? "green" : theme.error || "red")};
  margin-top: 10px;
`;

const AddWorkout = ({
  workout,
  setWorkout,
  addNewWorkout,
  buttonLoading,
  setButtonLoading,
}) => {
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);

  const checkWorkoutExists = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        "/api/user/check-workout",
        { workoutString: workout },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.exists;
    } catch (error) {
      console.error("Error checking workout:", error);
      // Allow proceeding rather than crashing
      return false;
    }
  };

  const addNewWorkoutHandler = async () => {
    if (!workout.trim()) {
      setMessage("Workout input cannot be empty.");
      setSuccess(false);
      return;
    }

    setButtonLoading(true);
    setMessage(null);

    try {
      const exists = await checkWorkoutExists();

      if (exists) {
        setMessage("This workout has already been added today.");
        setSuccess(false);
        return;
      }

      // Attempt to add workout via addNewWorkout function (which should call the backend)
      await addNewWorkout();

      setMessage("Workout added successfully!");
      setSuccess(true);
      setWorkout(""); // Clear input
    } catch (error) {
      console.error("Add workout failed:", error);
      const serverMessage = error?.response?.data?.message;

      // Handle specific message for duplicate workout
      if (serverMessage === "Workout already exists for today.") {
        setMessage(serverMessage);
      } else {
        setMessage(serverMessage || "Failed to add workout.");
      }

      setSuccess(false);
    } finally {
      setButtonLoading(false);
    }
  };

  return (
    <Card>
      <Title>Add New Workout</Title>
      <TextInput
        label="Workout"
        textArea
        rows={10}
        placeholder={`Enter in this format:

#Category
-Workout Name
-Sets
-Reps
-Weight
-Duration`}
        value={workout}
        handleChange={(e) => setWorkout(e.target.value)}
      />
      <Button
        text="Add Workout"
        small
        onClick={addNewWorkoutHandler}
        isLoading={buttonLoading}
        isDisabled={buttonLoading}
      />
      {message && <Message success={success}>{message}</Message>}
    </Card>
  );
};

export default AddWorkout;
