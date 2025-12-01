export function logout() {
  // Clear localStorage
  localStorage.removeItem("gc_token");
  localStorage.removeItem("gc_user_role");
  localStorage.removeItem("gc_user_firstname");
  localStorage.removeItem("gc_user_lastname");

  // Clear cookies
  document.cookie = "gc_token=; path=/; max-age=0";
  document.cookie = "gc_user_role=; path=/; max-age=0";

  // Redirect
  window.location.href = "/login";
}
