<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;

class UserRoleController extends Controller
{
    public function index()
    {
        return response()->json(Role::all());
    }
}
