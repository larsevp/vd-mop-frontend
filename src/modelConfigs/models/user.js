import { getUsers, deleteUser, createUser, updateUser, getPaginatedUser, getUserById } from "@/api/endpoints";

export const user = {
  queryKey: ["users"],
  queryFn: getPaginatedUser,
  getByIdFn: getUserById,
  createFn: createUser,
  updateFn: updateUser,
  deleteFn: deleteUser,
  title: "Brukere",
  desc: "Håndter registrerte brukere",
  modelPrintName: "bruker",
  newButtonLabelText: "Ny bruker",
  fields: [
    { name: "navn", label: "Navn", type: "text", required: true },
    { name: "epost", label: "E-post", type: "email", required: true },
    {
      name: "rolle",
      label: "Rolle",
      type: "select",
      required: true,
      options: [
        { value: "user", label: "User" },
        { value: "admin", label: "Admin" },
      ],
    },
    { name: "enhetId", label: "Enhet", type: "enhetselect", required: true, placeholder: "Velg enhet" },
  ],
};
