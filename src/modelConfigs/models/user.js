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
    { name: "password", label: "Passord", type: "password", required: false, hideIndex: true, hideEdit: true, placeholder: "Sett passord for manuell innlogging" },
    {
      name: "userType",
      label: "Brukertype",
      type: "select",
      required: true,
      options: [
        { value: "intern", label: "Intern" },
        { value: "ekstern", label: "Ekstern" },
      ],
      helpText: "Eksterne brukere har kun tilgang til tildelte prosjekter"
    },
    {
      name: "rolle",
      label: "Rolle",
      type: "select",
      required: true,
      options: [
        { value: "USER", label: "User" },
        { value: "ADMIN", label: "Admin" },
        { value: "PROJECT", label: "Project" },
        { value: "EXPERIENCED", label: "Experienced" },
        { value: "SUPER", label: "Super" },
        { value: "KING", label: "King" },
      ],
    },
    { name: "enhetId", label: "Enhet", type: "enhetselect", required: false, placeholder: "Velg enhet" },
    { name: "fagomradeId", label: "Fagområde", type: "fagomradeselect", required: false, placeholder: "Velg fagområde" },
    {
      name: "restricted",
      label: "Begrenset",
      type: "bool",
      required: true,
      default: false,
      placeholder: "Velg...",
      helpText: "Begrensede brukere kan ikke endre sin egen enhet"
    },
  ],
};
